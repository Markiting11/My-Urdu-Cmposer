
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCsrdWSKbc5upFvXDFmJtMws9cfsP3efeE",
  authDomain: "ai-dashboard-1d803.firebaseapp.com",
  projectId: "ai-dashboard-1d803",
  storageBucket: "ai-dashboard-1d803.firebasestorage.app",
  messagingSenderId: "357767878486",
  appId: "1:357767878486:web:cb47e068d5f780bab468f7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
