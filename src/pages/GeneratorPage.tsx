import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Stack,
  Text,
  useToast,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Tag,
  TagLabel,
  TagCloseButton,
  Input,
  HStack,
  VStack,
  Image,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import * as Tone from 'tone'
import axios from 'axios'

const MotionBox = motion(Box)

// Music key options
const keyOptions = [
  'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major',
  'Db Major', 'Ab Major', 'Eb Major', 'Bb Major', 'F Major',
  'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor', 'D# Minor',
  'Bb Minor', 'F Minor', 'C Minor', 'G Minor', 'D Minor'
]

// Available instruments
const instrumentOptions = [
  'Piano', 'Guitar', 'Drums', 'Bass', 'Strings', 'Synth', 'Brass', 'Woodwinds',
  'Electric Guitar', 'Acoustic Guitar', 'Violin', 'Cello', 'Flute', 'Saxophone',
  'Trumpet', 'Trombone'
]

// Mood options
const moodOptions = [
  'Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Mysterious', 'Epic', 'Playful',
  'Tense', 'Dreamy', 'Nostalgic', 'Hopeful'
]

// Genre options
const genreOptions = [
  'Pop', 'Rock', 'Jazz', 'Classical', 'Electronic', 'Hip Hop', 'R&B', 'Country',
  'Folk', 'Blues', 'Ambient', 'Cinematic', 'Lo-Fi'
]

export default function GeneratorPage() {
  const [selectedKey, setSelectedKey] = useState('')
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([])
  const [selectedMood, setSelectedMood] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [chordProgression, setChordProgression] = useState('')
  const [tempo, setTempo] = useState(120)
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  const [instrumentInput, setInstrumentInput] = useState('')
  const [duration, setDuration] = useState(30)
  
  const toast = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playerRef = useRef<Tone.Player | null>(null)
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedKey || selectedInstruments.length === 0 || !selectedMood || !selectedGenre) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      // Call the API to generate music
      const response = await axios.post('/api/generate', {
        key: selectedKey,
        instruments: selectedInstruments,
        mood: selectedMood,
        genre: selectedGenre,
        chords: chordProgression,
        tempo: tempo,
        duration: duration
      })
      
      // Get the audio URL from the actual response
      setAudioUrl(response.data.creation.audioUrl)
      
      toast({
        title: 'Success',
        description: 'Your music has been generated! This may take a few moments to process.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate music. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      console.error('Error generating music:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Add an instrument to the selected list
  const addInstrument = () => {
    if (
      instrumentInput &&
      !selectedInstruments.includes(instrumentInput) &&
      instrumentOptions.includes(instrumentInput)
    ) {
      setSelectedInstruments([...selectedInstruments, instrumentInput])
      setInstrumentInput('')
    }
  }
  
  // Remove an instrument from the selected list
  const removeInstrument = (instrument: string) => {
    setSelectedInstruments(selectedInstruments.filter(i => i !== instrument))
  }
  
  // Play the generated audio
  const playAudio = async () => {
    if (!audioUrl) return
    
    if (!playerRef.current) {
      await Tone.start()
      playerRef.current = new Tone.Player(audioUrl).toDestination()
      playerRef.current.autostart = true
    } else {
      playerRef.current.start()
    }
  }
  
  // Stop the audio playback
  const stopAudio = () => {
    if (playerRef.current) {
      playerRef.current.stop()
    }
  }
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
      }
    }
  }, [])
  
  return (
    <Container maxW="container.xl" py={10}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Heading mb={6} textAlign="center">Music Generator</Heading>
        <Text mb={10} textAlign="center" fontSize="xl" color="gray.600">
          Customize your parameters and create AI-generated music
        </Text>
      </MotionBox>
      
      <Flex direction={{ base: 'column', lg: 'row' }} gap={10}>
        <Box 
          w={{ base: '100%', lg: '50%' }} 
          p={8} 
          borderRadius="lg" 
          bg={useColorModeValue('white', 'gray.800')}
          boxShadow="xl"
        >
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel>Music Key</FormLabel>
              <Select 
                placeholder="Select key" 
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
              >
                {keyOptions.map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Instruments</FormLabel>
              <Flex>
                <Select 
                  placeholder="Select instruments"
                  value={instrumentInput}
                  onChange={(e) => setInstrumentInput(e.target.value)}
                  mr={2}
                >
                  {instrumentOptions.map((instrument) => (
                    <option key={instrument} value={instrument}>{instrument}</option>
                  ))}
                </Select>
                <Button onClick={addInstrument}>Add</Button>
              </Flex>
              
              <Box mt={3}>
                <HStack spacing={2} flexWrap="wrap">
                  {selectedInstruments.map((instrument) => (
                    <Tag 
                      key={instrument} 
                      size="md" 
                      borderRadius="full" 
                      variant="solid" 
                      colorScheme="blue"
                      my={1}
                    >
                      <TagLabel>{instrument}</TagLabel>
                      <TagCloseButton onClick={() => removeInstrument(instrument)} />
                    </Tag>
                  ))}
                </HStack>
              </Box>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Mood</FormLabel>
              <Select 
                placeholder="Select mood" 
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
              >
                {moodOptions.map((mood) => (
                  <option key={mood} value={mood}>{mood}</option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Genre</FormLabel>
              <Select 
                placeholder="Select genre" 
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                {genreOptions.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Chord Progression (optional)</FormLabel>
              <Input 
                placeholder="e.g., Cm7 - F7 - Bb - Eb" 
                value={chordProgression}
                onChange={(e) => setChordProgression(e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Tempo: {tempo} BPM</FormLabel>
              <Slider
                defaultValue={120}
                min={60}
                max={200}
                step={1}
                onChange={(val) => setTempo(val)}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </FormControl>
            
            <FormControl>
              <FormLabel>Duration: {duration} seconds</FormLabel>
              <Slider
                defaultValue={30}
                min={10}
                max={120}
                step={5}
                onChange={(val) => setDuration(val)}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </FormControl>
            
            <Button
              mt={4}
              colorScheme="blue"
              isLoading={isLoading}
              loadingText="Generating..."
              onClick={handleSubmit}
              size="lg"
              height="16"
              bgGradient="linear(to-r, primary.400, secondary.400)"
              _hover={{ bgGradient: "linear(to-r, primary.500, secondary.500)" }}
            >
              Generate Music
            </Button>
          </VStack>
        </Box>
        
        <Box 
          w={{ base: '100%', lg: '50%' }} 
          p={8} 
          borderRadius="lg" 
          bg={useColorModeValue('white', 'gray.800')}
          boxShadow="xl"
        >
          <VStack spacing={6} align="stretch" h="100%">
            <Heading size="md" mb={4}>Your Generated Music</Heading>
            
            {audioUrl ? (
              <VStack spacing={6} flex="1">
                <Box 
                  w="full" 
                  h="300px" 
                  bg="gray.100" 
                  borderRadius="md" 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center"
                  overflow="hidden"
                >
                  <Image
                    src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                    alt="Music Visualization"
                    objectFit="cover"
                    w="100%"
                    h="100%"
                  />
                </Box>
                
                <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
                
                <HStack spacing={4} w="full" justifyContent="center">
                  <Button 
                    onClick={playAudio} 
                    colorScheme="blue" 
                    size="lg" 
                    leftIcon={<span>▶️</span>}
                  >
                    Play
                  </Button>
                  <Button 
                    onClick={stopAudio} 
                    colorScheme="red" 
                    size="lg" 
                    leftIcon={<span>⏹️</span>}
                  >
                    Stop
                  </Button>
                </HStack>
                
                <Button 
                  as="a" 
                  href={audioUrl} 
                  download="musemap-generation.mp3"
                  colorScheme="green" 
                  size="lg"
                  leftIcon={<span>⬇️</span>}
                >
                  Download
                </Button>
                
                <Divider my={4} />
                
                <Box>
                  <Heading size="sm" mb={2}>Generated with:</Heading>
                  <Text><strong>Key:</strong> {selectedKey}</Text>
                  <Text><strong>Instruments:</strong> {selectedInstruments.join(', ')}</Text>
                  <Text><strong>Mood:</strong> {selectedMood}</Text>
                  <Text><strong>Genre:</strong> {selectedGenre}</Text>
                  <Text><strong>Tempo:</strong> {tempo} BPM</Text>
                  <Text><strong>Duration:</strong> {duration} seconds</Text>
                  {chordProgression && (
                    <Text><strong>Chord Progression:</strong> {chordProgression}</Text>
                  )}
                </Box>
              </VStack>
            ) : (
              <Flex 
                direction="column" 
                justify="center" 
                align="center" 
                h="100%" 
                flex="1" 
                textAlign="center" 
                color="gray.500"
                p={10}
              >
                <Box 
                  fontSize="6xl" 
                  mb={4}
                >
                  🎵
                </Box>
                <Text fontSize="xl" mb={4}>
                  Your music will appear here
                </Text>
                <Text>
                  Fill in the form and click "Generate Music" to create your AI-powered composition
                </Text>
              </Flex>
            )}
          </VStack>
        </Box>
      </Flex>
    </Container>
  )
} 