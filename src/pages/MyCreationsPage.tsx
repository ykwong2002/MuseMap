import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  Button,
  Flex,
  Image,
  Badge,
  HStack,
  Icon,
  useColorModeValue,
  StackDivider,
  VStack,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { FiMoreVertical, FiDownload, FiTrash2, FiShare2, FiEdit } from 'react-icons/fi'
import { FaMusic } from 'react-icons/fa'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

// Sample data for demonstration
const sampleCreations = [
  {
    id: '1',
    title: 'Upbeat Summer Melody',
    date: '2023-05-15',
    key: 'C Major',
    genre: 'Pop',
    mood: 'Happy',
    duration: '2:45',
    instruments: ['Piano', 'Guitar', 'Drums'],
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
    audioUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
  },
  {
    id: '2',
    title: 'Melancholic Autumn',
    date: '2023-06-02',
    key: 'A Minor',
    genre: 'Classical',
    mood: 'Sad',
    duration: '3:12',
    instruments: ['Piano', 'Strings'],
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/forest_ambience.ogg',
  },
  {
    id: '3',
    title: 'Electronic Fusion',
    date: '2023-06-10',
    key: 'F# Minor',
    genre: 'Electronic',
    mood: 'Energetic',
    duration: '4:05',
    instruments: ['Synth', 'Drums', 'Bass'],
    imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/alien_beam.ogg',
  },
]

// Define the type for a Creation
interface Creation {
  id: string
  title: string
  date: string
  key: string
  genre: string
  mood: string
  duration: string
  instruments: string[]
  imageUrl: string
  audioUrl: string
}

export default function MyCreationsPage() {
  const [creations, setCreations] = useState<Creation[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)
  const toast = useToast()
  
  // For demonstration, we'll use the sample data
  useEffect(() => {
    // In a real app, you would fetch this data from your API/database
    setCreations(sampleCreations)
  }, [])
  
  // Play audio function
  const playAudio = (id: string, audioUrl: string) => {
    // Stop any currently playing audio
    if (playingId) {
      const currentAudio = document.getElementById(`audio-${playingId}`) as HTMLAudioElement
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
    }
    
    // Play the selected audio
    const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement
    if (audio) {
      audio.play()
      setPlayingId(id)
      
      // When audio ends, reset the playing state
      audio.onended = () => {
        setPlayingId(null)
      }
    }
  }
  
  // Stop audio function
  const stopAudio = () => {
    if (playingId) {
      const audio = document.getElementById(`audio-${playingId}`) as HTMLAudioElement
      if (audio) {
        audio.pause()
        audio.currentTime = 0
        setPlayingId(null)
      }
    }
  }
  
  // Delete creation function
  const deleteCreation = (id: string) => {
    // In a real app, you would call your API to delete the creation
    setCreations(creations.filter(creation => creation.id !== id))
    toast({
      title: 'Creation deleted',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }
  
  // Format date function
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  
  return (
    <Container maxW="container.xl" py={10}>
      <Heading mb={2}>My Creations</Heading>
      <Text mb={10} color={textColor}>
        Your library of AI-generated music compositions
      </Text>
      
      {creations.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          You haven't created any music yet. Head over to the Generator to get started!
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
          {creations.map((creation) => (
            <MotionBox
              key={creation.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              borderRadius="lg"
              overflow="hidden"
              bg={bgColor}
              boxShadow="xl"
            >
              <Box position="relative" h="200px" overflow="hidden">
                <Image
                  src={creation.imageUrl}
                  alt={creation.title}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
                
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  w="100%"
                  h="100%"
                  bg="blackAlpha.600"
                  opacity={playingId === creation.id ? 1 : 0}
                  transition="opacity 0.3s"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  {playingId === creation.id && (
                    <Icon as={FaMusic} w={12} h={12} color="white" />
                  )}
                </Box>
                
                <audio 
                  id={`audio-${creation.id}`} 
                  src={creation.audioUrl} 
                  style={{ display: 'none' }}
                />
                
                <HStack
                  position="absolute"
                  bottom="0"
                  w="100%"
                  p={4}
                  bg="blackAlpha.700"
                  justifyContent="space-between"
                >
                  <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                    {creation.genre}
                  </Badge>
                  <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
                    {creation.key}
                  </Badge>
                </HStack>
              </Box>
              
              <Box p={5}>
                <Heading fontSize="xl" mb={2}>
                  {creation.title}
                </Heading>
                
                <Text fontSize="sm" color={textColor} mb={4}>
                  Created on {formatDate(creation.date)}
                </Text>
                
                <VStack
                  divider={<StackDivider borderColor="gray.200" />}
                  spacing={2}
                  align="stretch"
                  mb={4}
                >
                  <Flex justify="space-between">
                    <Text fontSize="sm" color={textColor}>
                      Mood
                    </Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {creation.mood}
                    </Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color={textColor}>
                      Duration
                    </Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {creation.duration}
                    </Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontSize="sm" color={textColor}>
                      Instruments
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" textAlign="right">
                      {creation.instruments.join(', ')}
                    </Text>
                  </Flex>
                </VStack>
                
                <Flex justify="space-between" align="center">
                  <Button
                    size="sm"
                    leftIcon={playingId === creation.id ? <FiTrash2 /> : <FaMusic />}
                    colorScheme={playingId === creation.id ? "red" : "blue"}
                    onClick={() => playingId === creation.id 
                      ? stopAudio() 
                      : playAudio(creation.id, creation.audioUrl)
                    }
                  >
                    {playingId === creation.id ? 'Stop' : 'Play'}
                  </Button>
                  
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FiMoreVertical />}
                      variant="ghost"
                      aria-label="Options"
                    />
                    <MenuList>
                      <MenuItem icon={<FiDownload />}>Download</MenuItem>
                      <MenuItem icon={<FiEdit />}>Rename</MenuItem>
                      <MenuItem icon={<FiShare2 />}>Share</MenuItem>
                      <MenuItem 
                        icon={<FiTrash2 />} 
                        color="red.500"
                        onClick={() => deleteCreation(creation.id)}
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </Box>
            </MotionBox>
          ))}
        </SimpleGrid>
      )}
    </Container>
  )
} 