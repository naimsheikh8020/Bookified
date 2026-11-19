"use server";

import { CreateBook, TextSegment } from "@/types";
import { connectToDatabase } from "@/database/mongoose";
import { escapeRegex, generateSlug, serializeData } from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import mongoose from "mongoose";
// import {getUserPlan} from "@/lib/subscription.server";
import { auth } from "@clerk/nextjs/server";

export const getAllBooks = async (search?: string) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const query: Record<string, any> = {
      clerkId: userId,
    };

    if (search?.trim()) {
      const escapedSearch = escapeRegex(search.trim());
      const regex = new RegExp(escapedSearch, "i");

      query.$or = [{ title: { $regex: regex } }, { author: { $regex: regex } }];
    }

    const books = await Book.find(query).sort({ createdAt: -1 }).lean();

    return {
      success: true,
      data: serializeData(books),
    };
  } catch (error) {
    console.error("Error fetching books:", error);

    return {
      success: false,
      error: "Failed to fetch books",
    };
  }
};

export const checkBookExists = async (title: string) => {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId) {
      return {
        exists: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const slug = generateSlug(title);

    const existingBook = await Book.findOne({
      clerkId: userId,
      slug,
    }).lean();

    if (existingBook) {
      return {
        exists: true,
        book: serializeData(existingBook),
      };
    }

    return {
      exists: false,
    };
  } catch (e) {
    console.error("Error checking book exists:", e);

    return {
      exists: false,
      error: "Failed to check book",
    };
  }
};

export const createBook = async (data: CreateBook) => {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const slug = generateSlug(data.title);

    // Check duplicates only inside the current user's library.
    const existingBook = await Book.findOne({
      clerkId: userId,
      slug,
    }).lean();

    if (existingBook) {
      return {
        success: true,
        data: serializeData(existingBook),
        alreadyExists: true,
      };
    }

    // Check subscription limits.
    const { getUserPlan } = await import("@/lib/subscription.server");
    const { PLAN_LIMITS } = await import("@/lib/subscription-constants");

    const plan = await getUserPlan();
    const limits = PLAN_LIMITS[plan];

    const bookCount = await Book.countDocuments({
      clerkId: userId,
    });

    if (bookCount >= limits.maxBooks) {
      return {
        success: false,
        error: `You have reached the maximum number of books allowed for your ${plan} plan (${limits.maxBooks}). Please upgrade to add more books.`,
        isBillingError: true,
      };
    }

    // Never trust the client to determine book ownership.
    const book = await Book.create({
      ...data,
      clerkId: userId,
      slug,
      totalSegments: 0,
    });

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (e: any) {
    // Handle simultaneous duplicate uploads.
    if (e?.code === 11000) {
      return {
        success: false,
        error: "You have already uploaded this book.",
      };
    }

    console.error("Error creating a book:", e);

    return {
      success: false,
      error: "Failed to create book.",
    };
  }
};

export const getBookBySlug = async (slug: string) => {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await connectToDatabase();

    const book = await Book.findOne({
      slug,
      clerkId: userId,
    }).lean();

    if (!book) {
      return {
        success: false,
        error: "Book not found",
      };
    }

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (error) {
    console.error("Error fetching book by slug:", error);

    return {
      success: false,
      error: "Failed to fetch book",
    };
  }
};

export const saveBookSegments = async (
  bookId: string,
  segments: TextSegment[],
) => {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    // 1. Authentication
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // 2. Validate book ID
    if (!mongoose.isValidObjectId(bookId)) {
      return {
        success: false,
        error: "Invalid book ID",
      };
    }

    // 3. Validate segments
    if (!Array.isArray(segments) || segments.length === 0) {
      return {
        success: false,
        error: "No segments provided",
      };
    }

    // 4. Validate individual segment data
const isValidSegments = segments.every(
    (segment) =>
        typeof segment.text === "string" &&
        segment.text.trim().length > 0 &&
        typeof segment.segmentIndex === "number" &&
        Number.isInteger(segment.segmentIndex) &&
        typeof segment.pageNumber === "number" &&
        Number.isInteger(segment.pageNumber) &&
        typeof segment.wordCount === "number" &&
        Number.isInteger(segment.wordCount) &&
        segment.segmentIndex >= 0 &&
        segment.pageNumber >= 1 &&
        segment.wordCount >= 0
);

    if (!isValidSegments) {
      return {
        success: false,
        error: "Invalid segment data",
      };
    }

    await connectToDatabase();

    const bookObjectId = new mongoose.Types.ObjectId(bookId);

    // 5. Verify book ownership
    const book = await Book.findOne({
      _id: bookObjectId,
      clerkId: userId,
    }).select("_id");

    if (!book) {
      return {
        success: false,
        error: "Book not found or unauthorized",
      };
    }

    // 6. Prepare segments
    const segmentsToInsert = segments.map(
      ({ text, segmentIndex, pageNumber, wordCount }) => ({
        clerkId: userId,
        bookId: book._id,
        content: text.trim(),
        segmentIndex,
        pageNumber,
        wordCount,
      }),
    );

    // 7. Insert segments
    await BookSegment.insertMany(segmentsToInsert);

    // 8. Update total segment count
    await Book.updateOne(
      {
        _id: book._id,
        clerkId: userId,
      },
      {
        $set: {
          totalSegments: segments.length,
        },
      },
    );

    return {
      success: true,
      data: {
        segmentsCreated: segments.length,
      },
    };
  } catch (error) {
    console.error("Error saving book segments:", error);

    return {
      success: false,
      error: "Failed to save book segments",
    };
  }
};

// Searches book segments using MongoDB text search with regex fallback
export const searchBookSegments = async (
  bookId: string,
  query: string,
  limit: number = 5,
) => {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
        data: [],
      };
    }

    if (!mongoose.isValidObjectId(bookId)) {
      return {
        success: false,
        error: "Invalid book ID",
        data: [],
      };
    }

    const searchQuery = query.trim();

    if (!searchQuery) {
      return {
        success: false,
        error: "Search query is required",
        data: [],
      };
    }

    const safeLimit = Math.min(Math.max(Math.floor(limit) || 5, 1), 20);

    await connectToDatabase();

    const bookObjectId = new mongoose.Types.ObjectId(bookId);

    // Verify ownership before accessing segments.
    const book = await Book.findOne({
      _id: bookObjectId,
      clerkId: userId,
    }).select("_id");

    if (!book) {
      return {
        success: false,
        error: "Book not found or unauthorized",
        data: [],
      };
    }

    const baseFilter = {
      bookId: bookObjectId,
      clerkId: userId,
    };

    let segments: Record<string, unknown>[] = [];

    // Try MongoDB text search first.
    try {
      segments = await BookSegment.find({
        ...baseFilter,
        $text: {
          $search: searchQuery,
        },
      })
        .select("_id bookId content segmentIndex pageNumber wordCount")
        .sort({
          score: {
            $meta: "textScore",
          },
        })
        .limit(safeLimit)
        .lean();
    } catch (error) {
      // Fall back if the text index is unavailable.
      console.error("Error saving book segments:", error);

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error while saving book segments",
      };
    }

    // Regex fallback.
    if (segments.length === 0) {
      const keywords = searchQuery
        .split(/\s+/)
        .filter((keyword) => keyword.length > 2);

      if (keywords.length > 0) {
        const pattern = keywords.map(escapeRegex).join("|");

        segments = await BookSegment.find({
          ...baseFilter,
          content: {
            $regex: pattern,
            $options: "i",
          },
        })
          .select("_id bookId content segmentIndex pageNumber wordCount")
          .sort({
            segmentIndex: 1,
          })
          .limit(safeLimit)
          .lean();
      }
    }

    return {
      success: true,
      data: serializeData(segments),
    };
  } catch (error) {
    console.error("Error searching book segments:", error);

    return {
      success: false,
      error: "Failed to search book segments",
      data: [],
    };
  }
};
