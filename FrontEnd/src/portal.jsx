import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children }) => {
  const portalRoot = useRef(document.getElementById('portal-root'));

  useEffect(() => {
    if (!portalRoot.current) {
      const div = document.createElement('div');
      div.id = 'portal-root';
      document.body.appendChild(div);
      portalRoot.current = div;
    }

    return () => {
      // Only remove the portal root if it's empty
      if (portalRoot.current && !portalRoot.current.children.length) {
        portalRoot.current.remove();
      }
    };
  }, []);

  if (!portalRoot.current) return null;
  
  return createPortal(children, portalRoot.current);
};

export default Portal;