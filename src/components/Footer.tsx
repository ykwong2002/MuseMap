import { Box, Container, Stack, Text, Link, useColorModeValue } from '@chakra-ui/react'

export default function Footer() {
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}
      borderTopWidth={1}
      borderStyle={'solid'}
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Container
        as={Stack}
        maxW={'6xl'}
        py={4}
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        justify={{ base: 'center', md: 'space-between' }}
        align={{ base: 'center', md: 'center' }}
      >
        <Text>© {new Date().getFullYear()} MuseMap. All rights reserved</Text>
        <Stack direction={'row'} spacing={6}>
          <Link href={'#'} isExternal>GitHub</Link>
          <Link href={'#'} isExternal>Twitter</Link>
          <Link href={'#'} isExternal>Discord</Link>
        </Stack>
      </Container>
    </Box>
  )
} 