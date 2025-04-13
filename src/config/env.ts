// Helper function to get environment variables
const getEnvVar = (key: string): string | undefined => {
    // In browser environment, we only have access to import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return (import.meta.env as Record<string, string>)[`VITE_${key}`];
    }
    return undefined;
};

export const config = {
    neo4j: {
        uri: getEnvVar('NEO4J_URI') || 'bolt://localhost:7687',
        user: getEnvVar('NEO4J_USER') || 'neo4j',
        password: getEnvVar('NEO4J_PASSWORD') || 'password'
    },
    openai: {
        apiKey: getEnvVar('OPENAI_API_KEY')
    }
};