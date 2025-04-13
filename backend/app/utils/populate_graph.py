import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Retrieve Neo4j connection details from .env
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

# Create a Neo4j driver instance
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

# This code snippet builds on the user's original function to create a much more comprehensive knowledge graph
# for music theory, including full scales, chord types, genres, and motifs using the Neo4j Python driver.

def create_music_theory_data(tx):
    # ---------------------------
    # Create all Scales (Major and Natural Minor for each root)
    # ---------------------------
    chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    def get_scale(root, intervals):
        index = chromatic.index(root)
        notes = [chromatic[(index + sum(intervals[:i])) % 12] for i in range(len(intervals) + 1)]
        return notes

    major_intervals = [2, 2, 1, 2, 2, 2, 1]       # W-W-H-W-W-W-H
    natural_minor_intervals = [2, 1, 2, 2, 1, 2, 2]  # W-H-W-W-H-W-W

    scales = []
    for note in chromatic:
        scales.append({
            "name": f"{note} Major",
            "type": "Major",
            "notes": get_scale(note, major_intervals)
        })
        scales.append({
            "name": f"{note} Minor",
            "type": "Natural Minor",
            "notes": get_scale(note, natural_minor_intervals)
        })

    tx.run("""
        UNWIND $scales AS s
        MERGE (scale:Scale {name: s.name})
        SET scale.type = s.type, scale.notes = s.notes
    """, scales=scales)

    # ---------------------------
    # Create Common Chords
    # ---------------------------
    chords = [
        {"name": "Major", "quality": "major", "intervals": [0, 4, 7]},
        {"name": "Minor", "quality": "minor", "intervals": [0, 3, 7]},
        {"name": "Diminished", "quality": "diminished", "intervals": [0, 3, 6]},
        {"name": "Augmented", "quality": "augmented", "intervals": [0, 4, 8]},
        {"name": "Major 7th", "quality": "major7", "intervals": [0, 4, 7, 11]},
        {"name": "Dominant 7th", "quality": "dom7", "intervals": [0, 4, 7, 10]},
        {"name": "Minor 7th", "quality": "minor7", "intervals": [0, 3, 7, 10]},
        {"name": "Half-diminished", "quality": "min7b5", "intervals": [0, 3, 6, 10]},
    ]

    chord_nodes = []
    for root in chromatic:
        root_index = chromatic.index(root)
        for chord in chords:
            chord_notes = [chromatic[(root_index + i) % 12] for i in chord["intervals"]]
            chord_nodes.append({
                "name": f"{root} {chord['name']}",
                "quality": chord["quality"],
                "notes": chord_notes
            })

    tx.run("""
        UNWIND $chords AS c
        MERGE (chord:Chord {name: c.name})
        SET chord.quality = c.quality, chord.notes = c.notes
    """, chords=chord_nodes)

    # ---------------------------
    # Genres and Their Rhythms
    # ---------------------------
    genres = [
        {"name": "Classical", "typicalRhythms": ["steady", "complex time signatures"]},
        {"name": "Jazz", "typicalRhythms": ["swing", "syncopation"]},
        {"name": "Rock", "typicalRhythms": ["straight", "backbeat"]},
        {"name": "Blues", "typicalRhythms": ["shuffle", "slow swing"]},
        {"name": "Pop", "typicalRhythms": ["4-on-the-floor", "straight"]},
        {"name": "Hip Hop", "typicalRhythms": ["breakbeat", "syncopation"]},
        {"name": "Electronic", "typicalRhythms": ["house beat", "breakbeat"]},
        {"name": "Reggae", "typicalRhythms": ["one-drop", "offbeat"]},
    ]
    tx.run("""
        UNWIND $genres AS g
        MERGE (genre:Genre {name: g.name})
        SET genre.typicalRhythms = g.typicalRhythms
    """, genres=genres)

    # ---------------------------
    # Motifs and Their Styles
    # ---------------------------
    motifs = [
        {"pattern": "ascending", "style": "bright"},
        {"pattern": "descending", "style": "melancholic"},
        {"pattern": "arpeggio", "style": "flowing"},
        {"pattern": "syncopated", "style": "rhythmic"},
        {"pattern": "scalar", "style": "linear"},
        {"pattern": "leapwise", "style": "bold"},
        {"pattern": "ostinato", "style": "hypnotic"},
        {"pattern": "pedal tone", "style": "anchoring"},
    ]
    tx.run("""
        UNWIND $motifs AS m
        MERGE (motif:Motif {pattern: m.pattern})
        SET motif.style = m.style
    """, motifs=motifs)

    # ---------------------------
    # Genre EMBRACES Motif
    # ---------------------------
    genre_motif_map = [
        {"genre": "Jazz", "motif": "syncopated"},
        {"genre": "Classical", "motif": "ascending"},
        {"genre": "Classical", "motif": "ostinato"},
        {"genre": "Rock", "motif": "arpeggio"},
        {"genre": "Blues", "motif": "descending"},
        {"genre": "Electronic", "motif": "pedal tone"},
        {"genre": "Pop", "motif": "scalar"},
        {"genre": "Hip Hop", "motif": "syncopated"},
    ]
    tx.run("""
        UNWIND $genre_motifs AS gm
        MATCH (g:Genre {name: gm.genre}), (m:Motif {pattern: gm.motif})
        MERGE (g)-[:EMBRACES]->(m)
    """, genre_motifs=genre_motif_map)


def populate_database():
    with driver.session() as session:
        session.execute_write(create_music_theory_data)
        print("Music theory data has been populated successfully.")

if __name__ == "__main__":
    populate_database()
    driver.close()