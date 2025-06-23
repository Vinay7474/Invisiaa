import './App.css';
import { useState } from 'react';
import HamburgerMenu from './Burger';
import { useNavigate } from 'react-router-dom';
import { generateIdentityKeyPair } from './crypto/useIdentityKey'; // adjust path if needed

export default function JoinSession() {
  const [file, setFile] = useState(null);
  const [securityQuestion, setSecurityQuestion] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [secretCode, setSecretCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSecurityQuestion(null);
    setSessionId(null);
    setAnswer('');
    setMessage(null);
    setVerificationStatus(null);
    setSecretCode('');
    setShowCodeInput(false);
  };

  const fetchSecurityQuestion = async () => {
    if (!file) return alert('Please select a QR code file first.');

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:8000/get_security_question/', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Could not read QR code.');
      }

      setSecurityQuestion(result.security_question);
      setSessionId(result.session_id);
      setVerificationStatus(null);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyAnswer = async () => {
    if (!answer.trim()) return alert('Please enter an answer.');

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:8000/verify_security_answer/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, answer }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Verification failed.');
      }

      if (result.verified) {
        setVerificationStatus('verified');

        sessionStorage.setItem('hasAccess', 'true');
        sessionStorage.setItem('avatar', JSON.stringify({
          id: result.assigned_avatar,
          name: result.avatar_name,
          image: result.avatar_image
        }));

        //  Wait for 6-digit secret code before redirecting
        setShowCodeInput(true);
      } else {
        setVerificationStatus('denied');
        setMessage('Wrong answer. Please try again.');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSecretCode = () => {
    if (secretCode.length !== 6 || !/^\d{6}$/.test(secretCode)) {
      setMessage('Please enter a valid 6-digit numeric code.');
      return;
    }

    const keys = generateIdentityKeyPair(secretCode);
    // console.log('Generated keys:', keys); // Optional for debug

    // Redirect to chat room with identity key passed in state (optional)
    sessionStorage.setItem('identityKey', JSON.stringify({
    publicKey: keys.publicKey,
    encryptedPrivateKey: keys.encryptedPrivateKey,
    nonce: keys.nonce
  }));
    navigate(`/chat/${sessionId}`, {
      state: {
        avatar: JSON.parse(sessionStorage.getItem('avatar')),
        identityKey: keys,
      }
    });
  };

  return (
    <>
      <header className="bg-purple-400 flex items-center justify-between px-8 py-4 h-20 relative">
        <div className="flex items-center space-x-4">
          <img
            src="./upscalemedia-transformed.png"
            alt="Invisiaa Logo"
            className="w-14 h-14 m-0 hover:opacity-10 duration-300"
          />
          <h1 className="text-4xl font-bold text-white hover:text-white/15 duration-300">Invisiaa</h1>
        </div>
        <HamburgerMenu />
      </header>

      <menu className="bg-body min-h-screen">
        <div className="flex justify-center items-center min-h-screen">
          <div className="w-full max-w-xl bg-purple-400 rounded-2xl hover:scale-105 duration-300 shadow-xl hover:shadow-purple-900 hover:shadow-2xl flex flex-col items-center gap-6 p-8">

            {!securityQuestion && (
              <>
                <h1 className="text-5xl text-white font-bold mb-2 text-center">Join Session</h1>
                <div className="flex flex-col w-full">
                  <label htmlFor="joinQR" className="text-white font-medium mb-1">
                    Upload QR Code
                  </label>
                  <input
                    type="file"
                    name="joinQR"
                    className="bg-white rounded-xl p-3 outline-none w-full text-gray-600/50"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </div>

                <button
                  disabled={loading || !file}
                  className="mt-4 bg-white text-purple-700 font-semibold rounded-xl p-3 w-full transition-all duration-300 hover:bg-purple-600 hover:text-white shadow-md hover:shadow-lg disabled:opacity-50"
                  onClick={fetchSecurityQuestion}
                >
                  {loading ? 'Checking QR...' : 'Check QR Code'}
                </button>
              </>
            )}

            {securityQuestion && verificationStatus === null && (
              <>
                <div className="mt-6 w-full">
                  <h1 className="text-5xl text-white font-bold mb-2 text-center">SECURITY QUESTION</h1>
                  <p className="text-purple-400 font-bold mt-2 border-2 p-3 text-3xl bg-white text-center rounded-2xl">
                    {securityQuestion}
                  </p>
                </div>

                <div className="mt-4 w-full">
                  <label htmlFor="answer" className="text-white font-medium mb-1 block">
                    Your Answer
                  </label>
                  <input
                    id="answer"
                    type="text"
                    className="bg-white rounded-xl p-3 outline-none w-full text-gray-600/50"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </div>

                <button
                  disabled={loading}
                  className="mt-4 bg-white text-purple-700 font-semibold rounded-xl p-3 w-full transition-all duration-300 hover:bg-purple-600 hover:text-white shadow-md hover:shadow-lg disabled:opacity-50"
                  onClick={verifyAnswer}
                >
                  {loading ? 'Verifying...' : 'Submit Answer'}
                </button>
              </>
            )}

            {verificationStatus && (
              <div className={`mt-6 text-6xl font-extrabold ${verificationStatus === 'verified' ? 'text-white' : 'text-white'}`}>
                {verificationStatus === 'verified' ? 'VERIFIED' : 'DENIED'}
              </div>
            )}

            {showCodeInput && (
              <div className="mt-6 w-full">
                <label className="text-white font-medium mb-1 block">
                  Enter 6-digit Secret Code
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="bg-white rounded-xl p-3 outline-none w-full text-gray-600/50 tracking-widest text-center"
                />
                <button
                  onClick={handleSubmitSecretCode}
                  className="mt-4 bg-white text-purple-700 font-semibold rounded-xl p-3 w-full transition-all duration-300 hover:bg-purple-600 hover:text-white shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  Enter Chat Room
                </button>
              </div>
            )}

            {message && (
              <div className="mt-4 text-center text-white font-semibold">
                {message}
              </div>
            )}
          </div>
        </div>
      </menu>
    </>
  );
}
