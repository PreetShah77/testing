import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, UserButton, useClerk, useUser } from "@clerk/clerk-react";
import "../styles/Header.css";
import { Link } from "react-router-dom";

function SignUpButton() {
  const clerk = useClerk();

  return (
    <button className="sign-up-btn" onClick={() => clerk.openSignUp({})}>
      Sign up
    </button>
  );
}

function SignInButton() {
  const clerk = useClerk();

  return (
    <button className="sign-in-btn" onClick={() => clerk.openSignIn({})}>
      Sign in
    </button>
  );
}

function Header() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useUser();
  
  useEffect(() => {
    if (user) {
      const email = user.primaryEmailAddress.emailAddress;
      // Here, we are assuming the password is known or managed securely
      const authMethods = user.externalAccounts; // Get external accounts like Google
      
      // Check if user logged in via Google
      const loggedInWithGoogle = authMethods.some(account => account.provider === 'google');

      if (!loggedInWithGoogle) {
        // Simulate secure password check (should be done on the server) Replace with actual secure password input handling

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
  
  return (
    <header>
      <nav>
        <SignedOut>
          <ul>
            <li>
              <SignUpButton />
            </li>
            <li>
              <SignInButton />
            </li>
          </ul>
        </SignedOut>

        <SignedIn>
          <ul>
            <li>
              <UserButton className="user-button" afterSignOutUrl="/" />
            </li>
            {isAdmin ? (
              <>
              <li>
              <Link to='/dashboard' style={{textDecoration: 'none'}}>
                <button className='sign-up-btn' style={{color: "#61dafb"}}>
                  Dashboard
                </button>
              </Link>
              </li>
              <li>
              <Link to='/crimemap' style={{textDecoration: 'none'}}>
                <button className='sign-up-btn' style={{color: "#61dafb"}}>
                  Map
                </button>
              </Link>
              </li>
              </>
            ) : (
              <>
                <li>
                <Link to='/crimemap' style={{textDecoration: 'none'}}>
                <button className='sign-up-btn' style={{color: "#61dafb"}}>
                  Map
                </button>
              </Link>
                </li>
                <li>
                  <Link to='/report' style={{textDecoration: 'none'}}>
                    <button className='sign-up-btn' style={{color: "#61dafb"}}>
                      Report Form
                    </button>
                  </Link>
                </li>
                <li>
                  <Link to='/myreport' style={{textDecoration: 'none'}}>
                    <button className='sign-up-btn' style={{color: "#61dafb"}}>
                      My Reports
                    </button>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </SignedIn>
      </nav>
    </header>
  );
}

export default Header;