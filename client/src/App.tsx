import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  // const [quote, setQuote] = useState<string>("Loading quote...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // // Fetch quote on page load
  // useEffect(() => {
  //   const fetchQuote = async () => {
  //     try {
  //       const res = await fetch(`${API_URL}/api/quote`);
  //       const data = await res.json();
  //       setQuote(data.quote);
  //     } catch (err) {
  //       console.error(err);
  //       setQuote("Take it one small step at a time today.");
  //     }
  //   };

  //   fetchQuote();
  // }, []);

  // Start live avatar session
  const handleStartSession = async () => {
    try {
      setError(null);
      setLoading(true);

      const res = await fetch(`${API_URL}/api/session`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to start session");
      }

      const data: { meetUrl: string } = await res.json();

      window.open(data.meetUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      setError("Unable to start session right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="card">
        <h1 className="title">Live Avatar Demo</h1>
        <p className="subtitle">
          Start a short watercooler chat with your avatar.
        </p>

        {/* <div className="quote-box">
          <span className="quote-label">QUOTE OF THE MOMENT (from OpenAI)</span>
          <p className="quote-text">{quote}</p>
        </div> */}

        {error && <p className="error">{error}</p>}

        <button
          className="cta-button"
          disabled={loading}
          onClick={handleStartSession}
        >
          {loading ? "Starting session..." : "Start Live Avatar Session"}
        </button>
      </div>
    </div>
  );
}

export default App;
