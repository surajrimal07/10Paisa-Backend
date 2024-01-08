# 10paisa - Backend

<p align="center">
  <img width="300" height="300" src="/public/images/logo.png?raw=true">
</p>


A Smart Investment backend made for Softwarica College of IT & E-Commerce, Coventry University

## Overview

The Smart Investment is a state-of-the-art backend that gives users the knowledge and insights they need to maximize their investment strategy. Utilizing technology, data analytics, and intelligent systems, this ground-breaking program offers users individualized investment suggestions, portfolio management, and real-time market analysis. This repository serves as a backend for 10Paisa frontend and mobile app.

## Features

- User registration and portfolio management: user registration, login, etc.
 
- Investment dashboard: a dashboard displaying an overview of the user's investment portfolios. End-of-day updates on investment opportunities, gains, and losses
 
- Diverse asset classes: The backend supports multiple asset classes like bonds, mutual funds, stocks, SIPs, IPOs, FPOs, etc. The backend also provides detailed information and research on each investment   asset class or opportunity.
 
- Portfolio tracking: ability to add, edit, and remove investments or portfolios. Portfolio performance charts and graphs.
 
- Portfolio rebalancing: portfolio rebalancing recommendations Ability to rebalance portfolios based on user criteria.
 
- Research and Analysis: Market news and updates, financial asset comparison, and research
  Investment recommendations are based on user preferences and goals.
 
- Goal Planning: Set financial goals (e.g retirement, children's education, buying a house).
  Track progress towards achieving those goals.

- Portfolio Comparison: comparing portfolios in terms of their dividend yield, yearly returns, capital appreciation, and liquidity.
 
- Transaction History: View the transaction history for all investments.
 
- Financial News and Insights: Up-to-date financial news and articles; data aggregation from third-party related news sites
 
- Personalized Recommendations: Simple algorithm-driven investment recommendations based on the user's financial criteria and goals
 
- Demo buy sell: The backend facilitates easy buying and selling of available asset classes and listed securities for learning purposes.
 
- Stock search and sorting: The backend facilitates users looking up stocks and investment opportunities.

## Screenshots
<img src="figma/grid/Screenshots/1.jpg?raw=true" width="400"/> <img src="figma/grid/Screenshots/2.jpg?raw=true" width="400"/>
<img src="figma/grid/Screenshots/3.jpg?raw=true" width="400"/> <img src="figma/grid/Screenshots/4.jpg?raw=true" width="400"/>
<img src="figma/grid/Screenshots/5.jpg?raw=true" width="400"/>


## Prerequisites

Before you start, make sure you have the following installed:
- Node.js: The backend server is built with Node.js. Install Node.js from the [official website](https://nodejs.org/).
- Database: You'll need a MongoDB database system or MongoDB Atlas, to store user and financial data. Make sure you have 'paisa' database with 'users' collection [official website](https://www.mongodb.com/try/download/community).

## TODO
- Recommendation system.

## What Works?
- Seperate user and admin dashboard
- Login (connected to MongoDB)
- Signup (connected to MongoDB)
- Web scarping for live prices and news
- token creation, validation and verification
- Seperate authorization for user and admin
- OTP verification (EMail OTP, uses nodemailer and [Google Mail Service](mail.google.com) service)
- Password reset, user data update.
- Live asset prices.
- Live notification (uses web socket)
- User token system (JWT).
- Account deletion, user deletion. 
- Web socket for live notifications
- Portfolio, create portfolio, edit portfolio, delete portfolio, add asset to portfolio, edit and delete asset from portfolio.
- Watchlist, create watchlist, edit watchlist, delete watchlist, add asset to watchlist, edit and delete asset from watchlist.
- Wacc calculation, portfolio adjustment.

## Technology Used
-  Rest API
-  Web Socket
-  JSON
-  React JS
-  Node JS
-  Mongo DB
-  Express JS
-  hashing
-  

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/st6003/backend-31a-surajrimal07

