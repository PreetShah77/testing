import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, UserButton, useClerk, useUser } from "@clerk/clerk-react";
import "../styles/Header.css";
import { Link, useNavigate } from "react-router-dom";

function SignUpButton() {
  const clerk = useClerk();
  return (
    <button onClick={() => clerk.openSignUp({})}>
      Sign up
    </button>
  );
}

function SignInButton() {
  const clerk = useClerk();
  return (
    <button onClick={() => clerk.openSignIn({})}>
      Sign in
    </button>
  );
}

function Header() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const email = user.primaryEmailAddress.emailAddress;
      const authMethods = user.externalAccounts;

      const loggedInWithGoogle = authMethods.some(account => account.provider === 'google');

      if (!loggedInWithGoogle) {
        const adminEmail = "vriddhishah21@gnu.ac.in";
        const adminPassword = "qweasd123../";

        if (email === adminEmail) {
          console.log("proper");
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    }
  }, [user]);

  const handleRedirect = (url) => {
    window.location.assign(url);
  };

  const handleSOS = () => {
    navigate('/sos');
  };

  return (
    <header className="header">
      <nav>
        <ul>
          {!isAdmin && (
            <li>
              <button onClick={handleSOS} className="sos-button">SOS</button>
            </li>
          )}
          <SignedIn>
            {isAdmin ? (
              <>

                <li><Link to="/dashboard">
                <button className='sign-up-btn' style={{color:"61dafb"}}>
                Dashboard
                </button>
                </Link></li>
                <li><Link to="/crimemap">
                <button className='sign-up-btn' style={{color:"61dafb"}}>
                Map
                </button>
                </Link></li>
              </>
            ) : (
              <>
                <li><Link to="/crimemap">
                <button className='sign-up-btn' style={{color:"61dafb"}}>
                Map
                </button>
                </Link></li>
                <li><Link to="/report">
                <button className='sign-up-btn' style={{color:"61dafb"}}>
                Report Form
                </button>
                </Link></li>
                <li><Link to="/myreport">
                <button className='sign-up-btn' style={{color:"61dafb"}}>
                My Reports
                </button>
                </Link></li>
              </>
            )}
            <li><UserButton /></li>
          </SignedIn>
          <SignedOut>
            <li><SignUpButton /></li>
            <li><SignInButton /></li>
          </SignedOut>
        </ul>
      </nav>
    </header>
  );
}

export default Header;