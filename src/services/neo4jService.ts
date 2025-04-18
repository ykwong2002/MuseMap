import neo4j, { Driver, Session, Record, Node } from 'neo4j-driver';
import { Scale, Chord, Progression, Genre } from '../types/music';
import { config } from '../config/env';

interface Neo4jGenreNode extends Node {
    properties: {
        id: string;
        name: string;
        commonProgressions: string[];
        commonScales: string[];
        tempoMin: number;
        tempoMax: number;
    };
}

interface Neo4jConfig {
    uri: string;
    user: string;
    password: string;
}

class Neo4jService {
    private driver: Driver | null = null;

    constructor() {
        // Don't initialize in constructor - wait for initialize call
    }

    initialize(config: Neo4jConfig) {
        if (this.driver) {
            return; // Already initialized
        }

        try {
            const cleanUri = config.uri.startsWith('bolt://') ? config.uri : `bolt://${config.uri}`;
            this.driver = neo4j.driver(
                cleanUri,
                neo4j.auth.basic(config.user, config.password),
                {
                    maxConnectionPoolSize: 50,
                    connectionTimeout: 5000,
                }
            );
        } catch (error) {
            console.error('Failed to create Neo4j driver:', error);
            throw error;
        }
    }

    private getDriver(): Driver {
        if (!this.driver) {
            // Initialize with default config if not initialized
            this.initialize(config.neo4j);
        }
        return this.driver!;
    }

    async getSession(): Promise<Session> {
        return this.getDriver().session();
    }

    private transformGenreRecord(record: Record): Genre {
        const genreNode = record.get('g') as Neo4jGenreNode;
        return {
            ...genreNode.properties,
            typicalTempo: {
                min: Number(genreNode.properties.tempoMin),
                max: Number(genreNode.properties.tempoMax)
            }
        };
    }

    async findScalesByMood(mood: string[]): Promise<Scale[]> {
        const session = await this.getSession();
        try {
            const result = await session.run(
                `MATCH (s:Scale)
                WHERE any(m IN $mood WHERE m IN s.mood)
                RETURN s`,
                { mood }
            );
            return result.records.map(record => record.get('s').properties as Scale);
        } finally {
            await session.close();
        }
    }

    async findProgressionsByGenre(genre: string): Promise<Progression[]> {
        const session = await this.getSession();
        try {
            const result = await session.run(
                `MATCH (p:Progression)
                WHERE $genre IN p.genre
                RETURN p`,
                { genre }
            );
            return result.records.map(record => record.get('p').properties as Progression);
        } finally {
            await session.close();
        }
    }

    async findChordsByScale(scaleId: string): Promise<Chord[]> {
        const session = await this.getSession();
        try {
            const result = await session.run(
                `MATCH (s:Scale {id: $scaleId})-[:CONTAINS]->(c:Chord)
                RETURN c`,
                { scaleId }
            );
            return result.records.map(record => record.get('c').properties as Chord);
        } finally {
            await session.close();
        }
    }

    async getGenreCharacteristics(genreName: string): Promise<Genre | null> {
        const session = await this.getSession();
        try {
            const result = await session.run(
                `MATCH (g:Genre {name: $genreName})
                RETURN g`,
                { genreName }
            );
            return result.records.length > 0 
                ? this.transformGenreRecord(result.records[0])
                : null;
        } finally {
            await session.close();
        }
    }

    async close(): Promise<void> {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
        }
    }
}

export const neo4jService = new Neo4jService();