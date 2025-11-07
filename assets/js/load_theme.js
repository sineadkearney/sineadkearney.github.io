//This is an IIFE (Immediately Invoked Function Expression) - 
// a function that runs immediately when it's defined.
(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    
    const themeMap = {
      light: 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/flatly/bootstrap.min.css',
      dark: 'https://cdn.jsdelivr.net/npm/bootswatch@5.3.2/dist/darkly/bootstrap.min.css'
    };
    
    // Inject stylesheet with correct theme immediately
    document.write('<link rel="stylesheet" href="' + themeMap[savedTheme] + '">');
  })();

/*
It is the same as the following, without adding to global scope:
// Define function
function myFunction() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  // ... rest of code
}

// Call function immediately
myFunction();
*/