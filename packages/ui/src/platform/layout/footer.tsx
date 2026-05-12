"use client";

import { Flex, Box, Text, Separator, Container, Heading } from "@radix-ui/themes";
import { Link } from "@welpco/ui/link";
import { IconButton } from "@welpco/ui/icon-button";
import { HandHeart, Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react";

export interface FooterProps {
  variant?: "default" | "minimal";
}

export function Footer({ variant = "default" }: FooterProps) {
  return (
    <Box
      asChild
      style={{
        backgroundColor: "var(--gray-2)",
        borderTop: "1px solid var(--gray-6)",
        marginTop: "auto",
      }}
    >
      <footer>
        <Container size="4" px={{ initial: "4", md: "6" }} py={{ initial: "6", md: "8" }}>
          <Flex direction="column" gap="6">
            {/* Main content row */}
            <Flex
              direction={{ initial: "column", md: "row" }}
              gap="8"
              justify="between"
              align="start"
            >
              {/* Brand block */}
              <Box style={{ maxWidth: "300px" }}>
                <Flex align="center" gap="2" mb="3">
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: "var(--green-9)",
                      borderRadius: "var(--radius-3)",
                    }}
                  >
                    <HandHeart
                      aria-hidden="true"
                      style={{
                        width: "18px",
                        height: "18px",
                        color: "var(--color-panel-solid)",
                      }}
                    />
                  </Flex>
                  <Heading size="5" style={{ color: "var(--green-11)" }}>
                    Welpco
                  </Heading>
                </Flex>
                <Text size="2" color="gray">
                  Connecting communities through trusted service providers. Find help
                  when you need it, or become a Welper and help others.
                </Text>
              </Box>

              {/* Link columns */}
              <Flex gap="8" direction={{ initial: "column", sm: "row" }} wrap="wrap">
                <Box asChild>
                  <nav aria-label="Company">
                    <Heading as="h3" size="3" mb="3">
                      Company
                    </Heading>
                    <Flex direction="column" gap="2">
                      <Link href="/#about" size="2" color="gray" underline="hover">
                        About us
                      </Link>
                      <Link href="/contact" size="2" color="gray" underline="hover">
                        Contact
                      </Link>
                      <Link href="/faq" size="2" color="gray" underline="hover">
                        FAQ
                      </Link>
                    </Flex>
                  </nav>
                </Box>

                <Box asChild>
                  <nav aria-label="Legal">
                    <Heading as="h3" size="3" mb="3">
                      Legal
                    </Heading>
                    <Flex direction="column" gap="2">
                      <Link href="/terms" size="2" color="gray" underline="hover">
                        Terms of service
                      </Link>
                      <Link href="/privacy" size="2" color="gray" underline="hover">
                        Privacy policy
                      </Link>
                    </Flex>
                  </nav>
                </Box>

                <Box>
                  <Heading as="h3" size="3" mb="3">
                    Contact
                  </Heading>
                  <Flex direction="column" gap="2">
                    <Flex align="center" gap="2">
                      <Mail
                        aria-hidden="true"
                        style={{ width: "16px", height: "16px", color: "var(--gray-9)" }}
                      />
                      <Text size="2" color="gray">
                        support@welpco.com
                      </Text>
                    </Flex>
                    <Flex align="center" gap="2">
                      <Phone
                        aria-hidden="true"
                        style={{ width: "16px", height: "16px", color: "var(--gray-9)" }}
                      />
                      <Text size="2" color="gray">
                        1-800-WELPCO
                      </Text>
                    </Flex>
                  </Flex>
                </Box>
              </Flex>
            </Flex>

            <Separator size="4" />

            {/* Bottom row */}
            <Flex
              justify="between"
              align="center"
              direction={{ initial: "column", sm: "row" }}
              gap="4"
            >
              <Text size="2" color="gray">
                © {new Date().getFullYear()} Welpco. All rights reserved.
              </Text>
              <Flex gap="2" align="center">
                <IconButton asChild variant="ghost" color="gray" aria-label="Facebook">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                    <Facebook
                      aria-hidden="true"
                      style={{ width: "20px", height: "20px" }}
                    />
                  </a>
                </IconButton>
                <IconButton asChild variant="ghost" color="gray" aria-label="Twitter">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <Twitter
                      aria-hidden="true"
                      style={{ width: "20px", height: "20px" }}
                    />
                  </a>
                </IconButton>
                <IconButton asChild variant="ghost" color="gray" aria-label="Instagram">
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <Instagram
                      aria-hidden="true"
                      style={{ width: "20px", height: "20px" }}
                    />
                  </a>
                </IconButton>
              </Flex>
            </Flex>
          </Flex>
        </Container>
      </footer>
    </Box>
  );
}

Footer.displayName = "Footer";
