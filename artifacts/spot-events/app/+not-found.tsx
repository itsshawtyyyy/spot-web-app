import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function NotFoundScreen() {
  const colors = useColors();

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Stack.Screen, { options: { title: 'Oops!' } }),
    React.createElement(
      View,
      { style: [styles.container, { backgroundColor: colors.background }] },
      React.createElement(
        Text,
        { style: [styles.title, { color: colors.foreground }] },
        "This screen doesn't exist."
      ),
      React.createElement(
        Link,
        { href: '/', style: styles.link },
        React.createElement(
          Text,
          { style: [styles.linkText, { color: colors.primary }] },
          'Go to home screen!'
        )
      )
    )
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
  },
});
