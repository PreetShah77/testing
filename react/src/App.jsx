import logo from "./logo.svg";
import "./styles/App.css";

function App() {
  return (
    <div className="app">
      <video autoPlay loop muted className="background-video">
      <source src="/india.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="content">
        <h1>Crime Watch</h1>
        <p>An app to help citizens report crimes promptly and accurately. 
          It provides real-time updates on crime incidents, secure authentication for users, 
          interactive maps for visualizing crime hotspots, and powerful search tools for efficient data retrieval.</p>
      </div>
    </div>
  );
}

export default App;
