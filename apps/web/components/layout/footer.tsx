"use client";

import Link from "next/link";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Separator } from "@welpco/ui/separator";
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <Box className="container mx-auto px-4 py-12">
        <Flex direction="column" gap="8">
          <Flex
            direction={{ initial: "column", md: "row" }}
            gap="8"
            justify="between"
          >
            <Box>
              <Text size="6" weight="bold" className="text-blue-600 mb-4 block">
                Welpco
              </Text>
              <Text size="2" color="gray" className="max-w-md">
                Connecting communities through trusted service providers. Find
                help when you need it, or become a Welper and help others.
              </Text>
            </Box>

            <Flex gap="8" direction={{ initial: "column", sm: "row" }}>
              <Box>
                <Text size="3" weight="bold" mb="3" className="block">
                  Company
                </Text>
                <Flex direction="column" gap="2">
                  <Link href="/#about">
                    <Text size="2" color="gray" className="hover:text-blue-600">
                      About Us
                    </Text>
                  </Link>
                  <Link href="/contact">
                    <Text size="2" color="gray" className="hover:text-blue-600">
                      Contact
                    </Text>
                  </Link>
                  <Link href="/faq">
                    <Text size="2" color="gray" className="hover:text-blue-600">
                      FAQ
                    </Text>
                  </Link>
                </Flex>
              </Box>

              <Box>
                <Text size="3" weight="bold" mb="3" className="block">
                  Legal
                </Text>
                <Flex direction="column" gap="2">
                  <Link href="/terms">
                    <Text size="2" color="gray" className="hover:text-blue-600">
                      Terms of Service
                    </Text>
                  </Link>
                  <Link href="/privacy">
                    <Text size="2" color="gray" className="hover:text-blue-600">
                      Privacy Policy
                    </Text>
                  </Link>
                </Flex>
              </Box>

              <Box>
                <Text size="3" weight="bold" mb="3" className="block">
                  Contact
                </Text>
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <Text size="2" color="gray">
                      support@welpco.com
                    </Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <Text size="2" color="gray">
                      1-800-WELPCO
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </Flex>
          </Flex>

          <Separator size="4" />

          <Flex
            justify="between"
            align="center"
            direction={{ initial: "column", sm: "row" }}
            gap="4"
          >
            <Text size="2" color="gray">
              © {new Date().getFullYear()} Welpco. All rights reserved.
            </Text>
            <Flex gap="4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </footer>
  );
}

