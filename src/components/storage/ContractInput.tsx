/**
 * Contract Input Component
 * Address input form with validation and quick examples
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';

/**
 * Example contracts for quick testing
 */
const EXAMPLE_CONTRACTS = [
  {
    name: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    description: 'USD Coin (ERC20)'
  },
  {
    name: 'WETH',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    description: 'Wrapped Ether'
  },
  {
    name: 'Uniswap V3 Router',
    address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    description: 'Uniswap V3 Swap Router'
  },
  {
    name: 'ENS Registry',
    address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    description: 'Ethereum Name Service'
  }
];

/**
 * Ethereum address validation regex
 */
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

interface ContractInputProps {
  onLoadContract: (address: string, chainId: number) => void;
  isLoading?: boolean;
}

export function ContractInput({ onLoadContract, isLoading = false }: ContractInputProps) {
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState('1'); // Ethereum mainnet
  const [error, setError] = useState('');

  /**
   * Validate Ethereum address
   */
  const validateAddress = (addr: string): boolean => {
    if (!addr) {
      setError('Please enter a contract address');
      return false;
    }

    if (!ADDRESS_REGEX.test(addr)) {
      setError('Invalid Ethereum address format');
      return false;
    }

    setError('');
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateAddress(address)) {
      onLoadContract(address, parseInt(chainId));
    }
  };

  /**
   * Handle address input change
   */
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setAddress(value);

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  /**
   * Load example contract
   */
  const loadExample = (exampleAddress: string) => {
    setAddress(exampleAddress);
    setError('');
    onLoadContract(exampleAddress, parseInt(chainId));
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="font-mono text-sm">
              Contract Address
            </Label>
            <div className="flex gap-2">
              <Input
                id="address"
                type="text"
                placeholder="0x..."
                value={address}
                onChange={handleAddressChange}
                disabled={isLoading}
                className={`font-mono ${error ? 'border-red-500' : ''}`}
                autoComplete="off"
                spellCheck={false}
              />
              <Select
                value={chainId}
                onValueChange={setChainId}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Ethereum Mainnet</SelectItem>
                  <SelectItem value="5" disabled>
                    Goerli (Coming soon)
                  </SelectItem>
                  <SelectItem value="137" disabled>
                    Polygon (Coming soon)
                  </SelectItem>
                  <SelectItem value="42161" disabled>
                    Arbitrum (Coming soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-sm text-red-500 font-mono">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !address}
            className="w-full font-mono"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading storage...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Load Storage
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Quick Examples */}
      <div className="space-y-3">
        <Label className="font-mono text-sm text-muted-foreground">
          Quick Examples
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EXAMPLE_CONTRACTS.map((example) => (
            <Button
              key={example.address}
              variant="outline"
              size="sm"
              onClick={() => loadExample(example.address)}
              disabled={isLoading}
              className="justify-start font-mono text-xs h-auto py-2 px-3"
            >
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold">{example.name}</span>
                <span className="text-muted-foreground text-[10px]">
                  {example.description}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs font-mono text-muted-foreground space-y-1 border-l-2 border-amber-500 pl-3">
        <p>• Enter any Ethereum contract address to explore its storage</p>
        <p>• Storage slots 0-255 will be fetched and decoded</p>
        <p>• Hover over cells for decoded values</p>
        <p>• Click cells for detailed interpretations</p>
      </div>
    </div>
  );
}
