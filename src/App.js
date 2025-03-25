import './App.css';
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import {BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Contact from "./pages/Contact";
import InvitationDetail from "./pages/InvitationDetail";
import Cart from "./pages/Cart";
import Personalize from "./pages/Personalize";
import {CartProvider} from "./helpers/CartProvider";


function App() {
  return (
    <div className="App">
        <CartProvider>
        <Router>
            <NavBar />
            <Routes>
                <Route exact path='/' element={<Home /> }/>
                <Route exact path='/menu' element={<Menu /> }/>
                <Route exact path='/about' element={<About /> }/>
                <Route exact path='/contact' element={<Contact /> }/>
                <Route path="/invitation-detail" element={<InvitationDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/personalize-invitation" element={<Personalize />} />
            </Routes>
        </Router>
        <Footer />
        </CartProvider>
    </div>

  );
}

export default App;
