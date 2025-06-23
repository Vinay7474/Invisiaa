import { useState } from 'react';
import './App.css';
import HamburgerMenu from './Burger';
import { saveAs } from 'file-saver';

function DownloadQR(base64Image){
    const byteString = atob(base64Image.split(',')[1]);
    const mimeString = base64Image.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString });
    saveAs(blob, 'session-qr.png');    
}

export default function CreateSession() {
    const [Participants, setParticipants] = useState("");
    const [SecurityQuestion, setQuestion] = useState("");
    const [SecurityAnswer, setAnswer] = useState("");
    const [QRurl, setQR] = useState("");

    const handleQR = async () => {
        const response = await fetch("http://localhost:8000/create_session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json", 
            },
            body: JSON.stringify({
                num_of_participants: Participants,
                security_question: SecurityQuestion,
                security_answer: SecurityAnswer,
            }),
        });

        const data = await response.json();
        if (data.qr_code_url) {
            setQR(data.qr_code_url);
        }
    };

    return (
        <>
            <header className="bg-purple-400 flex items-center justify-between px-8 py-4 h-20 relative">
                <div className="flex items-center space-x-4">
                <img src="/upscalemedia-transformed.png" alt="Invisiaa Logo" className="w-14 h-14 m-0 hover:opacity-10 duration-300" />
                <h1 className="text-4xl font-bold text-white hover:text-white/15 duration-300">
                        Invisiaa
                    </h1>
                </div>

                <HamburgerMenu />
            </header>
            <menu className="bg-body min-h-screen">
                <div className="flex justify-center items-center min-h-screen">
                    <div className="w-full max-w-xl bg-purple-400 rounded-2xl hover:scale-105 duration-300 shadow-xl hover:shadow-purple-900 hover:shadow-2xl flex flex-col items-center gap-6 p-8">
                    {QRurl ? (  
                                <div>
                                    <h2 className="text-2xl text-white font-semibold mb-4 text-center">Here is your QR code:</h2>
                                    <div className='flex justify-center items-center'>
                                        <img src={QRurl} alt="QR Code" className="max-w-xs mx-auto" />
                                    </div>

                                    <button
                                        onClick={() => DownloadQR(QRurl)}
                                        className="mt-4 bg-white text-purple-900 rounded-xl px-4 py-2 hover:bg-purple-700 hover:text-white w-80 duration-600"
                                    >
                                        Download QR
                                    </button>
                                </div>
                            ) : (
                            <>
                                <h1 className="text-5xl text-white font-bold mb-2 text-center">Create Session</h1>

                                <div className="flex flex-col w-full">
                                    <label htmlFor="participants" className="text-white font-medium mb-1">
                                        Number of Participants
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 3"
                                        name="participants"
                                        min={2}
                                        max={20}
                                        className="bg-white rounded-xl p-3 outline-none w-full"
                                        autoComplete='off'
                                        value={Participants}
                                        onChange={(e) => setParticipants(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col w-full">
                                    <label htmlFor="question" className="text-white font-medium mb-1">
                                        Security Question
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="What is my name?"
                                        name="question"
                                        className="bg-white rounded-xl p-3 outline-none w-full"
                                        value={SecurityQuestion}
                                        autoComplete='off'
                                        onChange={(e) => setQuestion(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col w-full">
                                    <label htmlFor="answer" className="text-white font-medium mb-1">
                                        Security Answer
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="John Wick"
                                        name="answer"
                                        className="bg-white rounded-xl p-3 outline-none w-full"
                                        value={SecurityAnswer}
                                        autoComplete='off'
                                        onChange={(e) => {
                                            setAnswer(e.target.value)
                                        }}
                                    />
                                </div>

                                <button className="mt-4 bg-white text-purple-700 font-semibold rounded-xl p-3 w-full transition-all duration-300 hover:bg-purple-600 hover:text-white shadow-md hover:shadow-lg"
                                    onClick={handleQR}>
                                    Generate QR CODE
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </menu>
        </>
    );
}
