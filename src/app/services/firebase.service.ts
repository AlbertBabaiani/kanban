import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private readonly app: FirebaseApp;
  public readonly auth: Auth;
  public readonly firestore: Firestore;

  constructor() {
    // Initialize the Firebase Application Instance
    this.app = initializeApp(environment.firebase);
    
    // Initialize Auth & Firestore Services
    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
  }
}
