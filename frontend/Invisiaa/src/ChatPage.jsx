import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { generateIdentityKeyPair } from "./crypto/useIdentityKey";
import { generateEphemeralKeyPair } from "./crypto/useEphemeralKey";
import { computeSharedSecret } from "./crypto/useSharedSecret";
import nacl from "tweetnacl";
import * as util from "tweetnacl-util";


export default function Chat() {
  const [userId] = useState(() => crypto.randomUUID());
  const { sessionId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const ws = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const [myAvatar, setMyAvatar] = useState(null);
  const [myName, setMyName] = useState("You");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const navigate = useNavigate();
  const [ephemeralKeyMap, setEphemeralKeyMap] = useState({});
  const [sharedSecrets, setSharedSecrets] = useState({});

useEffect(() => {
  const localEphemeralStr = localStorage.getItem(`ephemeralKey-${sessionId}`);
  if (!localEphemeralStr) {
    if (Object.keys(ephemeralKeyMap).length > 0) {
      console.warn(" No ephemeral key found for session:", sessionId);
    }
    return;
  }

  try {
    const localEphemeral = JSON.parse(localEphemeralStr);
    const secretKey = localEphemeral?.privateKey;

    if (!secretKey) {
      console.warn(" Ephemeral key exists but missing privateKey:", localEphemeral);
      return;
    }

    Object.entries(ephemeralKeyMap).forEach(([participantId, theirPublicKey]) => {
      if (!sharedSecrets[participantId]) {
        try {
          console.log("Computing shared secret for", participantId);
          const shared = computeSharedSecret(theirPublicKey, secretKey);
          console.log(" Shared secret derived for", participantId);
          setSharedSecrets((prev) => ({
            ...prev,
            [participantId]: shared,
          }));
        } catch (err) {
          console.error(` Failed to derive shared secret with ${participantId}:`, err);
        }
      } else {
        console.log(`ℹAlready have shared secret for ${participantId}`);
      }
    });
  } catch (err) {
    console.error("Failed to parse ephemeralKey from localStorage:", err);
  }
}, [ephemeralKeyMap, sessionId, sharedSecrets]);



  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "PrintScreen") {
        alert("Screenshots are not allowed!");
        navigator.clipboard.writeText("Screenshots are not allowed.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const cleanup = () => {
      sessionStorage.removeItem("hasAccess");
      sessionStorage.removeItem("avatar");
    };
    window.addEventListener("beforeunload", cleanup);
    return () => window.removeEventListener("beforeunload", cleanup);
  }, []);

  useEffect(() => {
    const hasAccess = sessionStorage.getItem("hasAccess");
    if (!hasAccess) {
      alert("Access denied. Please join through the proper flow.");
      navigate("/join");
    }
  }, [navigate]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  useEffect(() => {
    const identityKeyKey = `identityKey-${sessionId}`;
    const stored = localStorage.getItem(identityKeyKey);
    if (!stored) {
      const { publicKey, encryptedPrivateKey, nonce } = generateIdentityKeyPair(sessionId);
      const identityKey = { publicKey, encryptedPrivateKey, nonce };
      localStorage.setItem(identityKeyKey, JSON.stringify(identityKey));
      console.log("Generated identity key for", sessionId);
    }
  }, [sessionId]);

  const sendMessage = () => {
  const trimmed = input.trim();
  if (!trimmed || !ws.current || ws.current.readyState !== WebSocket.OPEN || !myAvatar) return;

  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Local echo
  setMessages((prev) => [
    ...prev,
    {
      text: trimmed,
      sender: "self",
      name: myName || "You",
      avatar: myAvatar || "/default-avatar.svg",
      time: timestamp,
    },
  ]);

  // Send encrypted or plain messages to each participant individually
    const payload = {
    type: "message",
    text: trimmed,
    timestamp,
    name: myName,
    avatar: myAvatar,
  };
  ws.current.send(JSON.stringify(payload));

  setInput("");
  inputRef.current?.focus();
};




  useEffect(() => {
    if (!sessionId) {
      alert("Session ID missing! Can't connect to chat.");
      return;
    }

    const socket = new WebSocket(`ws://localhost:8000/ws/${sessionId}/${userId}`);
    ws.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log("WebSocket message received:", data);

    // Set avatar, name, generate ephemeral & identity keys
    if (data.type === "self") {
      setMyAvatar(data.avatar);
      setMyName(data.name || "You");

      const ephemeralKey = generateEphemeralKeyPair();
      localStorage.setItem(`ephemeralKey-${sessionId}`, JSON.stringify(ephemeralKey));
      console.log("Ephemeral key generated & stored");

      // Slight delay to ensure key is stored before sending it
      setTimeout(() => {
        ws.current.send(JSON.stringify({
          type: "ephemeral_key",
          ephemeralPublicKey: ephemeralKey.publicKey
        }));
        console.log(" Sent ephemeral public key");
      }, 50);

      const stored = localStorage.getItem(`identityKey-${sessionId}`);
      if (stored) {
        const identity = JSON.parse(stored);
        const payload = {
          session_id: parseInt(sessionId),
          participant_id: userId,
          identity_public_key: identity.publicKey
        };
        fetch("http://localhost:8000/store_identity_key/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then(res => {
            if (!res.ok) throw new Error("Failed to upload identity key");
            console.log("Identity key stored");
          })
          .catch(err => console.error(" Upload failed:", err));
      }

      return;
    }

    // Store other user's ephemeral key
    if (data.type === "ephemeral_key" && data.from && data.ephemeralPublicKey) {
      if (data.from !== userId) {
        setEphemeralKeyMap(prev => ({
          ...prev,
          [data.from]: data.ephemeralPublicKey
        }));
        console.log(" Stored ephemeral key for", data.from);
      }
      return;
    }

    // Skip messages sent by self (already locally echoed)
    if (data.type === "message") {
  if (data.from === userId) {
    // Ignore message sent by self (already shown in local echo)
    return;
  }

  // Message from others
  setMessages((prev) => [...prev, {
    text: data.text,
    sender: "other",
    name: data.name,
    avatar: data.avatar,
    time: data.timestamp || new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  }]);
  return;
}

  } catch (err) {   
    console.error("Failed to parse WebSocket message:", err);
  }
};


    socket.onclose = () => {
      console.log("WebSocket disconnected. Reconnecting...");
      setTimeout(() => {
        ws.current = new WebSocket(`ws://localhost:8000/ws/${sessionId}/${userId}`);
      }, 1000);
    };

    socket.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    return () => socket.close();
  }, [sessionId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-[#f5f3ff]'}`}>
      <header className={`p-4 shadow-sm ${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-purple-100'}`}>
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-600' : 'bg-gradient-to-r from-purple-500 to-purple-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Chat Room</h1>
              <p className={`text-xs ${darkMode ? 'text-purple-300' : 'text-purple-500'}`}>Session: {sessionId || 'demo'}</p>
            </div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-600'}`}>
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className={`chat-scroll-area flex-1 overflow-y-auto p-4 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-[#f5f3ff]'}`}>
        <div className="max-w-[1400px] mx-auto space-y-3">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === "self" ? "justify-end" : "justify-start"}`}>
              <div className={`flex items-center gap-2 ${msg.sender === "self" ? "flex-row-reverse" : ""}`}>
                <div className="flex justify-center items-center">
                  <div className={`relative ${msg.sender === "self" ? "self-avatar" : "other-avatar"}`}>
                    <img
                      src={msg.avatar || "/default-avatar.svg"}
                      alt="avatar"
                      className="w-14 h-14 rounded-full border border-purple-300 "
                    />
                  </div>
                </div>
                <div className={`rounded-2xl p-4 pt-0.5 pb-0.5 max-w-xs md:max-w-md lg:max-w-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02]
                  ${msg.sender === "self"
                    ? darkMode
                      ? "bg-gradient-to-r from-purple-600 to-[#ba68c8] text-white rounded-br-none"
                      : "bg-gradient-to-r from-[#ba68c8] to-purple-400 text-white rounded-br-none"
                    : darkMode
                      ? "bg-gray-700 text-gray-100 rounded-bl-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                  }`}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`text-xs font-semibold ${darkMode ? "text-purple-200" : "text-purple-600"}`}>
                    {msg.sender === "self" ? "You" : msg.name || "User"}
                    </span>
                  </div>
                  <p className="text-sm break-words">{msg.text}</p>
                  <p className={`text-xs mt-2 text-right ${msg.sender === "self"
                    ? darkMode ? 'text-purple-200' : 'text-purple-100'
                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>{msg.time}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </main>

      <footer className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-t ${darkMode ? 'border-gray-700' : 'border-purple-100'}`}>
  <div className="max-w-[1400px] mx-auto flex gap-3 items-center">

    {/* Emoji SVG */}
    <button  onClick={() => setShowEmojiPicker(prev => !prev)} className="w-8 h-8 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-12 h-12">
        <defs>
          <style>
            {`.cls-2{fill:#273941}.cls-3{fill:#141e21}.cls-4{fill:#f6fafd}`}
          </style>
        </defs>
        <g id="_02-smile" data-name="02-smile">
          <circle cx="24" cy="24" r="23" style={{ fill: '#ffce52' }} />
          <ellipse className="cls-2" cx="33" cy="18" rx="3" ry="4" />
          <ellipse className="cls-2" cx="15" cy="18" rx="3" ry="4" />
          <ellipse className="cls-3" cx="33" cy="18" rx="2" ry="3" />
          <ellipse className="cls-3" cx="15" cy="18" rx="2" ry="3" />
          <circle className="cls-4" cx="34" cy="17" r="1" />
          <circle className="cls-4" cx="16" cy="17" r="1" />
          <path className="cls-2" d="M24 39c-7.72 0-14-5.832-14-13h2c0 6.065 5.383 11 12 11s12-4.935 12-11h2c0 7.168-6.28 13-14 13z" />
        </g>
      </svg>
    </button>
      {showEmojiPicker && (
    <div className="absolute bottom-20 left-4 z-50">
      <Picker
        data={data}
        onEmojiSelect={(emoji) => {
          setInput((prev) => prev + emoji.native);
          setShowEmojiPicker(false);
          inputRef.current?.focus();
        }}
        theme={darkMode ? "dark" : "light"}
      />
    </div>
  )}

    {/* Input Box */}
    <div className="flex-1 relative">
      <input
        ref={inputRef}
        className={`w-full border ${darkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' : 'bg-white border-purple-200 focus:border-purple-400'} rounded-full py-3 px-5 pr-12 outline-none transition-all duration-300 shadow-sm focus:shadow-md`}
        type="text"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>

    {/* Send Button */}
    <button
      onClick={sendMessage}
      disabled={!input.trim()}
      className={`p-3 rounded-full ${darkMode ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400' : 'bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-400 hover:to-purple-300'} text-white shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:transform-none`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    </button>

  </div>
</footer>

    </div>
  );
}