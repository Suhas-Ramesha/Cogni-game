import { Component, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { BigButton } from './BigButton';

export class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };

  static getDerivedStateFromError(err: Error) {
    return { err };
  }

  render() {
    if (this.state.err) {
      return (
        <View style={{ flex: 1, backgroundColor: '#F6EFE4', padding: 24, justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, color: '#9B1D20' }}>Something went wrong.</Text>
          <Text style={{ fontSize: 18, marginTop: 12 }}>{this.state.err.message}</Text>
          <BigButton label="Try again" onPress={() => this.setState({ err: null })} />
        </View>
      );
    }
    return this.props.children;
  }
}
