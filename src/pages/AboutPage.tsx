import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Icon,
  Stack,
  VStack,
  HStack,
  Button,
  Link,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react'
import { FaMusic, FaRobot, FaCode, FaLaptopCode, FaGithub, FaTwitter } from 'react-icons/fa'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

export default function AboutPage() {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={12} align="stretch">
        {/* Hero Section */}
        <Box textAlign="center" mb={10}>
          <Heading as="h1" size="2xl" mb={4}>
            About MuseMap
          </Heading>
          <Text fontSize="xl" maxW="3xl" mx="auto" color="gray.600">
            Creating beautiful music with the power of artificial intelligence.
          </Text>
        </Box>
        
        {/* Mission Statement */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          p={10}
          borderRadius="lg"
          bg={bgColor}
          boxShadow="xl"
          textAlign="center"
        >
          <VStack spacing={6}>
            <Heading as="h2" size="xl">Our Mission</Heading>
            <Text fontSize="lg" maxW="4xl">
              MuseMap aims to democratize music creation by leveraging cutting-edge AI technology. 
              We believe everyone should be able to express themselves through music, 
              regardless of their technical skill or formal training.
            </Text>
          </VStack>
        </MotionBox>
        
        {/* How it Works Section */}
        <Box py={10}>
          <Heading as="h2" size="lg" mb={8} textAlign="center">
            How MuseMap Works
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <MotionBox
              whileHover={{ y: -10 }}
              p={6}
              boxShadow="xl"
              rounded="lg"
              bg={bgColor}
              border="1px"
              borderColor={borderColor}
            >
              <Flex
                w={16}
                h={16}
                align={'center'}
                justify={'center'}
                color={'white'}
                rounded={'full'}
                bg={'blue.500'}
                mb={4}
              >
                <Icon as={FaMusic} w={8} h={8} />
              </Flex>
              <Heading fontSize="xl" mb={4}>
                Musical Parameters
              </Heading>
              <Text color={'gray.600'}>
                You specify your desired musical parameters such as key, mood, genre, 
                and instruments. These choices guide the AI in generating your personalized music.
              </Text>
            </MotionBox>
            
            <MotionBox
              whileHover={{ y: -10 }}
              p={6}
              boxShadow="xl"
              rounded="lg"
              bg={bgColor}
              border="1px"
              borderColor={borderColor}
            >
              <Flex
                w={16}
                h={16}
                align={'center'}
                justify={'center'}
                color={'white'}
                rounded={'full'}
                bg={'purple.500'}
                mb={4}
              >
                <Icon as={FaRobot} w={8} h={8} />
              </Flex>
              <Heading fontSize="xl" mb={4}>
                AI Generation
              </Heading>
              <Text color={'gray.600'}>
                Our advanced neural networks process your parameters and generate 
                original musical compositions. The AI has been trained on a diverse 
                corpus of music across many genres and styles.
              </Text>
            </MotionBox>
            
            <MotionBox
              whileHover={{ y: -10 }}
              p={6}
              boxShadow="xl"
              rounded="lg"
              bg={bgColor}
              border="1px"
              borderColor={borderColor}
            >
              <Flex
                w={16}
                h={16}
                align={'center'}
                justify={'center'}
                color={'white'}
                rounded={'full'}
                bg={'green.500'}
                mb={4}
              >
                <Icon as={FaLaptopCode} w={8} h={8} />
              </Flex>
              <Heading fontSize="xl" mb={4}>
                Your Creation
              </Heading>
              <Text color={'gray.600'}>
                The AI delivers a complete, original musical piece that you can preview, 
                download, and use however you want. Each creation is unique and tailored 
                to your specifications.
              </Text>
            </MotionBox>
          </SimpleGrid>
        </Box>
        
        {/* Technology Stack */}
        <Box py={10}>
          <Heading as="h2" size="lg" mb={8} textAlign="center">
            Our Technology Stack
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            <MotionBox
              whileHover={{ scale: 1.02 }}
              p={6}
              borderRadius="lg"
              bg={bgColor}
              boxShadow="md"
              border="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>Frontend</Heading>
              <VStack align="start" spacing={3}>
                <HStack>
                  <Icon as={FaCode} color="blue.500" />
                  <Text>React with TypeScript</Text>
                </HStack>
                <HStack>
                  <Icon as={FaCode} color="blue.500" />
                  <Text>Chakra UI for beautiful interfaces</Text>
                </HStack>
                <HStack>
                  <Icon as={FaCode} color="blue.500" />
                  <Text>Framer Motion for smooth animations</Text>
                </HStack>
                <HStack>
                  <Icon as={FaCode} color="blue.500" />
                  <Text>Tone.js for audio manipulation</Text>
                </HStack>
              </VStack>
            </MotionBox>
            
            <MotionBox
              whileHover={{ scale: 1.02 }}
              p={6}
              borderRadius="lg"
              bg={bgColor}
              boxShadow="md"
              border="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={4}>Backend</Heading>
              <VStack align="start" spacing={3}>
                <HStack>
                  <Icon as={FaCode} color="purple.500" />
                  <Text>Node.js with Express</Text>
                </HStack>
                <HStack>
                  <Icon as={FaCode} color="purple.500" />
                  <Text>Python with FastAPI for AI inference</Text>
                </HStack>
                <HStack>
                  <Icon as={FaCode} color="purple.500" />
                  <Text>MusicGen/Magenta for music generation</Text>
                </HStack>
                <HStack>
                  <Icon as={FaCode} color="purple.500" />
                  <Text>Firebase for data storage</Text>
                </HStack>
              </VStack>
            </MotionBox>
          </SimpleGrid>
        </Box>
        
        {/* Team Section */}
        <Box py={10}>
          <Heading as="h2" size="lg" mb={4} textAlign="center">
            Meet the Team
          </Heading>
          <Text textAlign="center" mb={8} maxW="3xl" mx="auto" color="gray.600">
            MuseMap is created by a passionate team of developers, musicians, and AI enthusiasts 
            who believe in the power of technology to enhance creative expression.
          </Text>
          
          {/* Team member cards would go here */}
        </Box>
        
        {/* Contact / Connect Section */}
        <Box py={10} textAlign="center">
          <Heading as="h2" size="lg" mb={6}>
            Connect With Us
          </Heading>
          <Text mb={8} maxW="2xl" mx="auto" color="gray.600">
            Have questions, suggestions, or feedback? We'd love to hear from you!
          </Text>
          
          <HStack spacing={4} justify="center">
            <Button
              leftIcon={<FaGithub />}
              colorScheme="gray"
              variant="outline"
              as={Link}
              href="https://github.com"
              isExternal
            >
              GitHub
            </Button>
            <Button
              leftIcon={<FaTwitter />}
              colorScheme="twitter"
              as={Link}
              href="https://twitter.com"
              isExternal
            >
              Twitter
            </Button>
            <Button
              colorScheme="blue"
              bgGradient="linear(to-r, primary.400, secondary.400)"
              _hover={{ bgGradient: "linear(to-r, primary.500, secondary.500)" }}
              color="white"
              as={Link}
              href="mailto:contact@musemap.com"
            >
              Email Us
            </Button>
          </HStack>
        </Box>
      </VStack>
    </Container>
  )
} 