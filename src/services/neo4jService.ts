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

class Neo4jService {
    private driver: Driver;

    constructor() {
        const { uri, user, password } = config.neo4j;
        const cleanUri = uri.startsWith('bolt://') ? uri : `bolt://${uri}`;

        try {
            this.driver = neo4j.driver(
                cleanUri,
                neo4j.auth.basic(user, password),
                {
                    maxConnectionPoolSize: 50,
                    connectionTimeout: 5000, // 5 seconds
                }
            );
        } catch (error) {
            console.error('Failed to create Neo4j driver:', error);
            throw error;
        }
    }

    async getSession(): Promise<Session> {
        return this.driver.session();
    }

    private transformGenreRecord(record: Record): Genre {
        const genreNode = record.get('g') as Neo4jGenreNode;
        return {
            ...genreNode.properties,
            typicalTempo: {
                min: genreNode.properties.tempoMin,
                max: genreNode.properties.tempoMax
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
        await this.driver.close();
    }
}

export const neo4jService = new Neo4jService();