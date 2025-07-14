// Environment configuration for VH Banquets mobile app
const ENV = {
  development: {
    API_BASE_URL: 'http://localhost:3001/api',
    API_TIMEOUT: 10000,
    DEBUG: true,
  },
  staging: {
    API_BASE_URL: 'https://vh-banquets-staging.herokuapp.com/api',
    API_TIMEOUT: 10000,
    DEBUG: false,
  },
  production: {
    API_BASE_URL: 'https://vh-banquets-api.herokuapp.com/api',
    API_TIMEOUT: 15000,
    DEBUG: false,
  },
};

const getEnvironment = () => {
  if (__DEV__) {
    return ENV.development;
  }
  
  // You can add staging detection logic here
  // For now, non-dev builds are considered production
  return ENV.production;
};

export default getEnvironment();
