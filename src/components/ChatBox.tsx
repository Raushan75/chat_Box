"use client";

import {
  getAuthClient,
  db,
  githubProvider,
  googleProvider,
} from "@/libs/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import {
  onSnapshot,
  addDoc,
  collection,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { FormEvent, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";

interface Message {
  id: string;
  text: string;
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt: any | null;
}

export default function ChatBox() {
  const authClient = getAuthClient();
  const [user, setUser] = useState<User | null>(null);
  const [loadingauth, setLoadingAuth] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!authClient) return;
    const unsubscribe = onAuthStateChanged(authClient, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [authClient]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [formValue, setFormValue] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
          id: doc.id,
          text: data.text,
          uid: data.uid,
          displayName: data.displayName,
          photoURL: data.photoURL,
          createdAt: data.createdAt,
        });
      });
      setMessages(fetchedMessages);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (
    provider: typeof googleProvider | typeof githubProvider,
  ): Promise<void> => {
    if (!authClient || authLoading) return;

    try {
      setAuthLoading(true);
      setAuthError(null);

      const result = await signInWithPopup(authClient, provider);

      console.log("User:", result.user);
    } catch (error: any) {
      console.error(error);

      console.log("Code:", error.code);
      console.log("Message:", error.message);

      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendMessage = async (
    e: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (!user) {
      console.log("No authenticated user");
      return;
    }

    if (!formValue.trim()) {
      console.log("Empty message");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "messages"), {
        text: formValue.trim(),
        uid: user.uid,
        displayName: user.displayName ?? "Anonymous User",
        photoURL: user.photoURL ?? "",
        createdAt: serverTimestamp(),
      });

      console.log("Message stored:", docRef.id);

      setFormValue("");
    } catch (error: any) {
      console.error("Firestore Error:", error);
      console.log("Code:", error.code);
      console.log("Message:", error.message);
    }
  };

  if (loadingauth) {
    return (
      <div className="text-center py-10 text-gray-500 font-medium">
        Loading Chat Engine....
      </div>
    );
  }
  return (
    <div className="w-full max-w-xl mx-auto border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg bg-white dark:bg-gray-950 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          Welcome {user?.displayName}
        </h3>

        {user && (
          <button
            onClick={() => {
              if (!authClient) return;
              signOut(authClient);
            }}
            className="text-xs font-medium text-red-500 hover:underline"
          >
            Sign Out
          </button>
        )}
      </div>

      {user ? (
        <div className="h-90 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/30">
          {messages.map((message) => {
            const isMe = message.uid === user.uid;

            return (
              <div
                key={message.id}
                className={`flex gap-3 items-start ${
                  isMe ? "flex-row-reverse" : ""
                }`}
              >
                <img
                  src={message.photoURL}
                  alt={message.displayName}
                  className="w-8 h-8 rounded-full bg-gray-200"
                />

                <div
                  className={`flex flex-col max-w-[75%] ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  <span className="text-xs text-gray-500 mb-0.5">
                    {message.displayName}
                  </span>

                  <div
                    className={`p-3 rounded-2xl text-sm ${
                      isMe
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-tl-none shadow-sm"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-90 text-gray-500">
          Sign in to start chatting
        </div>
      )}

      <div>
        {user ? (
          <form onSubmit={handleSendMessage} className="flex gap-2 p-4">
            <input
              type="text"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder="Type your message here"
              className="flex-1 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-900 rounded-lg border focus:outline-none focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm"
            >
              Send
            </button>
          </form>
        ) : (
          <div className="p-4 space-y-2">
            <button
              onClick={() => handleLogin(googleProvider)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm transition-colors hover:bg-blue-500"
            >
              Sign in with Google
            </button>
            <button
              onClick={() => handleLogin(githubProvider)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gray-800 text-white font-medium text-sm transition-colors hover:bg-gray-700"
            >
              Sign in with Github
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
