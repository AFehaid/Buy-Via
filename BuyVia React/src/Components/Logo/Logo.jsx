import './Logo.css';
export default function Logo() {
    return(
        <button class="button" data-text="Awesome">
    <span className="actual-text">&nbsp;BuyVia&nbsp;</span>
    
    <span aria-hidden="true" className="hover-text">&nbsp;BuyVia&nbsp;</span>
    </button>
    )
}