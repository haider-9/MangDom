import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-background mt-20 py-4 border-t">
        <div className="text-center text-foreground text-sm">
          <p> &copy; {new Date().getFullYear()}, All rights reserved.</p>
        </div>
    </footer>
  );
}

export default Footer
