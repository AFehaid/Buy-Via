import React, {useState, useEffect} from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter as Router , Route , Routes} from 'react-router-dom'
import "./style.css";
import api from './api'
import Navbar from "./Components/Navbar/Navbar";
import Logo from "./Components/Logo/Logo";
import Home from './Pages/home';
import Contact_us from './Pages/contact_us';
import Login from './Pages/login';
import SearchResults from './Pages/SearchResults';
import Img_Slider from './Components/Img_Slider/Img_Slider'
import Sign_up from "./Pages/sign_up";
import AuthProvider from "./contexts/AuthProvider";
import ProductDetails from "./Pages/ProductDetails";
import Footer from "./Components/Footer/Footer";
import CategoryProducts from "./Pages/CategoryProducts";
import AlertManagement from "./Pages/AlertManagement";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AlertProvider } from "./contexts/AlertContext";



function App() {
  const [activeForm, setActiveForm] = useState("signIn");

  return (
    // TEST
    <div>
      
      <AuthProvider>
        <LanguageProvider>
          <AlertProvider>
      <Router>
      <Navbar />
      <main className="App-main">
        
      <Routes>
      <Route path="Home" element={<Home />}></Route>
      <Route path="/" element={<Home />}></Route>

      <Route path="/alerts" element={<AlertManagement/>} />
      <Route path="Login" element={<Login />}/>
      <Route path="Sign_Up" element={<Sign_up />}/>
      <Route path="/category/:categoryId" element={<CategoryProducts />} />
      <Route path="Search" element={<SearchResults />} />
      <Route path="/product/:productId" element={<ProductDetails />} />

      </Routes>
      <Footer/>
      </main>

      </Router>
      </AlertProvider>
      </LanguageProvider>     </AuthProvider>
    </div> 
  );
}
export default App;