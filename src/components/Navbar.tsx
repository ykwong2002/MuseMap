import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  useColorModeValue,
  Stack,
  Link,
  Container,
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import { motion } from 'framer-motion'

interface NavLinkProps {
  children: React.ReactNode
  to: string
}

const NavLink = ({ children, to }: NavLinkProps) => (
  <Link
    as={RouterLink}
    to={to}
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('gray.200', 'gray.700'),
    }}
  >
    {children}
  </Link>
)

const MotionBox = motion(Box)

export default function Navbar() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isScrolled, setIsScrolled] = useState(false)

  // Change navbar appearance on scroll
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    })
  }

  const Links = [
    { name: 'Home', path: '/' },
    { name: 'Generator', path: '/generator' },
    { name: 'My Creations', path: '/my-creations' },
    { name: 'About', path: '/about' },
  ]

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      zIndex="1000"
      bg={isScrolled ? 'white' : 'transparent'}
      boxShadow={isScrolled ? 'sm' : 'none'}
      transition="all 0.3s ease"
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={'center'}>
            <RouterLink to="/">
              <MotionBox
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                fontWeight="bold"
                fontSize="xl"
                bgGradient="linear(to-r, primary.500, secondary.500)"
                bgClip="text"
              >
                MuseMap
              </MotionBox>
            </RouterLink>
            <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
              {Links.map((link) => (
                <NavLink key={link.name} to={link.path}>
                  {link.name}
                </NavLink>
              ))}
            </HStack>
          </HStack>
          <Flex alignItems={'center'}>
            <Button
              as={RouterLink}
              to="/generator"
              variant={'solid'}
              colorScheme={'blue'}
              bgGradient="linear(to-r, primary.400, secondary.400)"
              _hover={{ bgGradient: "linear(to-r, primary.500, secondary.500)" }}
              size={'sm'}
              mr={4}
              display={{ base: 'none', md: 'inline-flex' }}
            >
              Create Music
            </Button>
          </Flex>
        </Flex>

        {isOpen ? (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as={'nav'} spacing={4}>
              {Links.map((link) => (
                <NavLink key={link.name} to={link.path}>
                  {link.name}
                </NavLink>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Container>
    </Box>
  )
} 