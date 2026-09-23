import { Text, View } from 'react-native';
import { Component, ReactNode } from 'react';
import { BigButton } from './BigButton';

export class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };

  static getDerivedStateFromError(err: Error) {
    return { err };
  }

  render() {
    if (this.state.err) {
      return (
        <View style={{ flex: 1, backgroundColor: '#F4EDE1', padding: 24, justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#9B1D20' }}>Something went wrong.</Text>
          <Text style={{ fontSize: 20, marginTop: 12, color: '#5C4A3A', lineHeight: 28 }}>
            {this.state.err.message}
          </Text>
          <BigButton label="Try again" onPress={() => this.setState({ err: null })} />
        </View>
      );
    }
    return this.props.children;
  }
}
