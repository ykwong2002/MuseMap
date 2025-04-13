import neo4j, { Driver, Session } from 'neo4j-driver';
import { Scale, Chord, Progression, Genre } from '../types/music';

class Neo4jService {
    private driver: Driver;

    constructor() {
        this.driver = neo4j.driver(
            process.env.NEO4J_URI || 'bolt://localhost:7687',
            neo4j.auth.basic(
                process.env.NEO4J_USER || 'neo4j',
                process.env.NEO4J_PASSWORD || 'password'
            )
        );
    }

    async getSession(): Promise<Session> {
        return this.driver.session();
    }

    private transformGenreRecord(record: any): Genre {
        const properties = record.get('g').properties;
        return {
            ...properties,
            typicalTempo: {
                min: properties.tempoMin,
                max: properties.tempoMax
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