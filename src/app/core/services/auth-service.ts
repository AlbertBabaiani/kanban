import { Injectable, inject, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { Router } from '@angular/router';
import { FirebaseService } from './firebase-service';
import { KanbanService } from './kanban-service';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly firebaseService = inject(FirebaseService);
  private readonly kanbanService = inject(KanbanService);
  private readonly router = inject(Router);

  private readonly auth = this.firebaseService.auth;
  private readonly db = this.firebaseService.firestore;

  // --- Reactive Signals State Management ---
  public readonly currentUser = signal<UserProfile | null>(null);
  public readonly isAuthLoading = signal<boolean>(true);

  constructor() {
    // Listen to Firebase Auth state shifts dynamically
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await this.fetchUserProfile(firebaseUser.uid);
          if (profile) {
            this.currentUser.set(profile);
            // Subscribe the kanban data queries for this authenticated user session
            this.kanbanService.subscribeToBoards(firebaseUser.uid);
          } else {
            // Profile doc missing, create fallback profile from Auth display name
            const fallbackProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
              lastName: firebaseUser.displayName?.split(' ')[1] || '',
            };
            this.currentUser.set(fallbackProfile);
            this.kanbanService.subscribeToBoards(firebaseUser.uid);
          }
        } catch (err) {
          console.error('Failed to resolve authenticated user profile:', err);
          this.currentUser.set(null);
          this.kanbanService.unsubscribeAll();
        }
      } else {
        this.currentUser.set(null);
        // Safely unsubscribe to clean memory bounds
        this.kanbanService.unsubscribeAll();
      }
      this.isAuthLoading.set(false);
    });
  }

  /**
   * Registers a new user account, creates local details in Auth, and commits records to Firestore.
   */
  public async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<void> {
    this.isAuthLoading.set(true);
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      const uid = credential.user.uid;

      // Update auth profile displayName standard field
      await updateProfile(credential.user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });

      const profile: UserProfile = {
        uid,
        email,
        firstName,
        lastName,
      };

      // Set Firestore profile document record
      await setDoc(doc(this.db, 'users', uid), {
        ...profile,
        createdAt: serverTimestamp(),
      });

      this.currentUser.set(profile);
      this.kanbanService.subscribeToBoards(uid);
      this.isAuthLoading.set(false);
    } catch (error: any) {
      this.isAuthLoading.set(false);
      throw error;
    }
  }

  /**
   * Performs basic email and password session authentication.
   */
  public async signIn(email: string, password: string): Promise<void> {
    this.isAuthLoading.set(true);
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      const profile = await this.fetchUserProfile(credential.user.uid);
      if (profile) {
        this.currentUser.set(profile);
        this.kanbanService.subscribeToBoards(credential.user.uid);
      }
      this.isAuthLoading.set(false);
    } catch (error: any) {
      this.isAuthLoading.set(false);
      throw error;
    }
  }

  /**
   * Clears the current active session state and redirects browser paths.
   */
  public async logout(): Promise<void> {
    this.isAuthLoading.set(true);
    try {
      await signOut(this.auth);
      this.currentUser.set(null);
      this.kanbanService.unsubscribeAll();
      this.isAuthLoading.set(false);
      await this.router.navigate(['/login']);
    } catch (error: any) {
      this.isAuthLoading.set(false);
      throw error;
    }
  }

  /**
   * Fetches user profile data from Firestore "/users/{uid}" path.
   */
  private async fetchUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(this.db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  }
}
