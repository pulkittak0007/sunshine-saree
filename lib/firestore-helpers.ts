import { doc, setDoc, getDoc, type DocumentData } from "firebase/firestore"
import { db } from "./firebase"

/**
 * Safely gets a document from Firestore with error handling
 */
export async function safeGetDoc(
  collection: string,
  docId: string,
): Promise<{
  success: boolean
  data?: DocumentData
  error?: any
}> {
  try {
    const docRef = doc(db, collection, docId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() }
    } else {
      return { success: false, error: "Document does not exist" }
    }
  } catch (error) {
    console.error(`Error getting document from ${collection}:`, error)
    return { success: false, error }
  }
}

/**
 * Safely sets a document in Firestore with error handling
 */
export async function safeSetDoc(
  collection: string,
  docId: string,
  data: any,
  options?: { merge?: boolean },
): Promise<{ success: boolean; error?: any }> {
  try {
    const docRef = doc(db, collection, docId)
    await setDoc(docRef, data, options)
    return { success: true }
  } catch (error) {
    console.error(`Error setting document in ${collection}:`, error)
    return { success: false, error }
  }
}

/**
 * Tracks a product view or action
 * This is non-critical functionality that should never block the user experience
 */
export async function trackProductAction(
  userId: string,
  productId: number,
  productName: string,
  productImage: string,
  action: string,
): Promise<void> {
  try {
    await safeSetDoc(
      "productViews",
      `${userId}_${productId}_${Date.now()}`,
      {
        userId,
        productId,
        productName,
        productImage,
        action,
        viewedAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp for better offline support
      },
      { merge: true },
    )
  } catch (error) {
    // Silently log the error but don't throw - this is non-critical functionality
    console.error("Error tracking product action:", error)
  }
}

/**
 * Updates a user profile in Firestore with fallback to localStorage
 */
export async function updateUserProfile(
  userId: string,
  userData: any,
  options?: { merge?: boolean },
): Promise<{ success: boolean; error?: any }> {
  try {
    // Try to update in Firestore
    const result = await safeSetDoc(
      "users",
      userId,
      {
        ...userData,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true, ...options },
    )

    // If Firestore update fails, save to localStorage as fallback
    if (!result.success) {
      try {
        localStorage.setItem(
          `user_${userId}`,
          JSON.stringify({
            ...userData,
            lastUpdated: new Date().toISOString(),
          }),
        )
      } catch (localStorageError) {
        console.error("Error saving user data to localStorage:", localStorageError)
      }
    }

    return result
  } catch (error) {
    console.error("Error updating user profile:", error)

    // Try localStorage as fallback
    try {
      localStorage.setItem(
        `user_${userId}`,
        JSON.stringify({
          ...userData,
          lastUpdated: new Date().toISOString(),
        }),
      )
    } catch (localStorageError) {
      console.error("Error saving user data to localStorage:", localStorageError)
    }

    return { success: false, error }
  }
}

