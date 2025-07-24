import React from 'react';
import logo from '../assets/logo.png';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <img src={logo} alt="Logo" className="logo"/>
      <h1 className="title">Bitcoin Bear Bull Meter</h1>
    </header>
  );
}