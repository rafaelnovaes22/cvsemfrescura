// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for user login
Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
    email: email || Cypress.env('testEmail'),
    password: password || Cypress.env('testPassword')
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('token');
    
    // Store the token for subsequent requests
    window.localStorage.setItem('authToken', response.body.token);
    window.localStorage.setItem('userId', response.body.userId);
    
    // Set authorization header for future requests
    cy.wrap(response.body.token).as('authToken');
  });
});

// Custom command for user registration
Cypress.Commands.add('register', (userData) => {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    phone: '11999999999'
  };
  
  const user = { ...defaultUser, ...userData };
  
  cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, user)
    .then((response) => {
      expect(response.status).to.eq(201);
      return response.body;
    });
});

// Custom command for authenticated API requests
Cypress.Commands.add('authenticatedRequest', (method, url, body) => {
  cy.get('@authToken').then((token) => {
    cy.request({
      method: method,
      url: url,
      body: body,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  });
});

// Custom command to create a CV
Cypress.Commands.add('createCV', (cvData) => {
  const defaultCV = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '11999999999',
    objective: 'Test objective',
    experience: 'Test experience',
    education: 'Test education',
    skills: 'Test skills'
  };
  
  const cv = { ...defaultCV, ...cvData };
  
  cy.authenticatedRequest('POST', `${Cypress.env('apiUrl')}/cv/create`, cv);
});

// Custom command to redeem gift code
Cypress.Commands.add('redeemGiftCode', (code) => {
  cy.request('POST', `${Cypress.env('apiUrl')}/gift-codes/redeem`, {
    code: code || Cypress.env('testGiftCode')
  });
});

// Custom command to wait for element with retry
Cypress.Commands.add('waitForElement', (selector, options = {}) => {
  const defaultOptions = {
    timeout: 10000,
    interval: 500,
    ...options
  };
  
  cy.get(selector, { timeout: defaultOptions.timeout })
    .should('be.visible');
});

// Custom command to check if user is logged in
Cypress.Commands.add('checkAuth', () => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('authToken');
    if (token) {
      cy.wrap(token).as('authToken');
      return true;
    }
    return false;
  });
});

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit('/');
});

// Custom command to upload file
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = '') => {
  cy.fixture(fileName, 'base64').then(fileContent => {
    cy.get(selector).attachFile({
      fileContent: fileContent,
      fileName: fileName,
      mimeType: fileType || 'application/octet-stream',
      encoding: 'base64'
    });
  });
});

// Custom command for uploading CV file
Cypress.Commands.add('uploadCV', (filePath) => {
  cy.get('[data-cy="file-upload-input"]').selectFile(filePath, {
    force: true
  });
  
  // Wait for file to be processed
  cy.get('[data-cy="file-name"]').should('be.visible');
});

// Custom command for filling job description
Cypress.Commands.add('fillJobDescription', (description) => {
  cy.get('[data-cy="job-description-textarea"]')
    .clear()
    .type(description, { delay: 0 });
});

// Custom command for complete CV analysis
Cypress.Commands.add('analyzeCV', (cvFile, jobDescription) => {
  // Upload CV
  cy.uploadCV(cvFile);
  
  // Fill job description
  cy.fillJobDescription(jobDescription);
  
  // Click analyze button
  cy.get('[data-cy="analyze-button"]').click();
  
  // Wait for analysis to complete
  cy.get('[data-cy="loading-spinner"]', { timeout: 30000 })
    .should('not.exist');
});

// Custom command for checking analysis results
Cypress.Commands.add('checkAnalysisResults', () => {
  // Verify we're on results page
  cy.url().should('include', '/results');
  
  // Check main elements are visible
  cy.get('[data-cy="match-score"]').should('be.visible');
  cy.get('[data-cy="strengths-section"]').should('be.visible');
  cy.get('[data-cy="improvements-section"]').should('be.visible');
  cy.get('[data-cy="keywords-section"]').should('be.visible');
});

// Custom command for mobile viewport testing
Cypress.Commands.add('testMobileViewport', (device = 'iphone-x') => {
  cy.viewport(device);
  
  // Check mobile-specific elements
  cy.get('body').then($body => {
    if ($body.find('[data-cy="mobile-menu-button"]').length > 0) {
      cy.get('[data-cy="mobile-menu-button"]').should('be.visible');
    }
  });
});