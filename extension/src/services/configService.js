// Configuration Service
// Manages application configuration and API keys

class ConfigService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.config = null;
    this.configPromise = null;
  }

  // Fetch configuration from backend
  async fetchConfig() {
    if (this.configPromise) {
      return this.configPromise;
    }

    this.configPromise = new Promise(async (resolve) => {
      try {
        console.log('🔧 ConfigService: Fetching configuration from backend...');
        
        const response = await fetch('http://localhost:3001/api/config/config', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('🔧 ConfigService: Response status:', response.status);
        console.log('🔧 ConfigService: Response ok:', response.ok);

        if (response.ok) {
          const config = await response.json();
          console.log('🔧 ConfigService: Received config from backend:', {
            hasGoogleClientId: !!config.googleClientId,
            hasClioClientId: !!config.clioClientId,
            hasGeminiApiKey: !!config.geminiApiKey,
            googleClientId: config.googleClientId ? `${config.googleClientId.substring(0, 10)}...` : 'not set',
            clioClientId: config.clioClientId ? `${config.clioClientId.substring(0, 10)}...` : 'not set',
            geminiApiKey: config.geminiApiKey ? `${config.geminiApiKey.substring(0, 10)}...` : 'not set'
          });
          
          this.config = config;
          resolve(this.config);
        } else {
          console.error('❌ ConfigService: Backend returned error status:', response.status);
          const errorText = await response.text();
          console.error('❌ ConfigService: Error response:', errorText);
          throw new Error(`Backend returned ${response.status}: ${errorText}`);
        }
      } catch (error) {
        console.error('❌ ConfigService: Error fetching configuration:', error);
        console.log('🔧 ConfigService: Falling back to default config');
        // Fallback to default config
        this.config = this.getDefaultConfig();
        resolve(this.config);
      }
    });

    return this.configPromise;
  }

  // Get default configuration (fallback)
  getDefaultConfig() {
    return {
      googleClientId: 'your_google_client_id_here',
      clioClientId: 'your_clio_client_id_here',
      geminiApiKey: 'your_gemini_api_key_here',
      port: 3001,
      nodeEnv: 'development',
      allowedOrigins: 'http://localhost:5173,chrome-extension://*'
    };
  }

  // Get specific configuration value
  async getConfig(key) {
    const config = await this.fetchConfig();
    return config[key];
  }

  // Get Google OAuth configuration
  async getGoogleOAuthConfig() {
    const config = await this.fetchConfig();
    return {
      clientId: config.googleClientId
    };
  }

  // Get Clio OAuth configuration
  async getClioOAuthConfig() {
    const config = await this.fetchConfig();
    return {
      clientId: config.clioClientId
    };
  }

  // Get AI service configuration
  async getAIServiceConfig() {
    const config = await this.fetchConfig();
    return {
      geminiApiKey: config.geminiApiKey
    };
  }

  // Get server configuration
  async getServerConfig() {
    const config = await this.fetchConfig();
    return {
      port: config.port,
      nodeEnv: config.nodeEnv,
      allowedOrigins: config.allowedOrigins
    };
  }

  // Test configuration import
  async testConfigImport() {
    try {
      console.log('🔧 Testing configuration import...');
      const config = await this.fetchConfig();
      
      console.log('📋 Configuration received:', {
        hasGoogleClientId: !!config.googleClientId,
        hasClioClientId: !!config.clioClientId,
        hasGeminiApiKey: !!config.geminiApiKey,
        googleClientId: config.googleClientId ? `${config.googleClientId.substring(0, 10)}...` : 'not set',
        clioClientId: config.clioClientId ? `${config.clioClientId.substring(0, 10)}...` : 'not set',
        geminiApiKey: config.geminiApiKey ? `${config.geminiApiKey.substring(0, 10)}...` : 'not set'
      });
      
      return {
        success: true,
        config: {
          googleClientId: !!config.googleClientId,
          clioClientId: !!config.clioClientId,
          geminiApiKey: !!config.geminiApiKey
        }
      };
    } catch (error) {
      console.error('❌ Configuration import test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ConfigService(); 