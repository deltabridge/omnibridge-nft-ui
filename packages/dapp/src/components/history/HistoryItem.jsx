import {
  Button,
  Flex,
  Grid,
  Image,
  Link,
  Text,
  useToast,
} from '@chakra-ui/react';
import BlueTickImage from 'assets/blue-tick.svg';
import RightArrowImage from 'assets/right-arrow.svg';
import { DisplayTokens } from 'components/common/DisplayTokens';
import { useBridgeDirection } from 'hooks/useBridgeDirection';
import { useClaim } from 'hooks/useClaim';
import { isRevertedError, TOKENS_CLAIMED } from 'lib/amb';
import { getExplorerUrl, logError } from 'lib/helpers';
import React, { useCallback, useState } from 'react';

const shortenHash = hash =>
  `${hash.slice(0, 6)}...${hash.slice(hash.length - 4, hash.length)}`;

const Tag = ({ bg, txt }) => (
  <Flex
    justify="center"
    align="center"
    bg={bg}
    borderRadius="6px"
    px="0.75rem"
    height="1.5rem"
    fontSize="xs"
    color="white"
    fontWeight="600"
    w="auto"
  >
    <Text>{txt}</Text>
  </Flex>
);

const networkTags = {
  100: <Tag bg="#4DA9A6" txt="xDai" />,
  1: <Tag bg="#5A74DA" txt="Ethereum" />,
  4: <Tag bg="#5A74DA" txt="Rinkeby" />,
  42: <Tag bg="#5A74DA" txt="Kovan" />,
  77: <Tag bg="#4DA9A6" txt="POA Sokol" />,
  56: <Tag bg="#5A74DA" txt="BSC" />,
};

const getNetworkTag = chainId => networkTags[chainId];

export const HistoryItem = ({
  data: {
    tokens,
    timestamp,
    sendingTx,
    receivingTx: inputReceivingTx,
    message,
  },
  handleClaimError,
}) => {
  const { chainId } = tokens;
  const { getBridgeChainId, getMonitorUrl } = useBridgeDirection();
  const bridgeChainId = getBridgeChainId(chainId);

  const timestampString = new Date(
    parseInt(timestamp, 10) * 1000,
  ).toLocaleTimeString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const toast = useToast();
  const showError = useCallback(
    msg => {
      if (msg) {
        toast({
          title: 'Error',
          description: msg,
          status: 'error',
          isClosable: 'true',
        });
      }
    },
    [toast],
  );

  const [claimed, setClaimed] = useState(!!inputReceivingTx);
  const [claiming, setClaiming] = useState(false);
  const [txHash, setTxHash] = useState();
  let receivingTx = inputReceivingTx;
  if (claimed && txHash) {
    receivingTx = txHash;
  }

  const claim = useClaim();

  const claimTokens = useCallback(async () => {
    try {
      setClaiming(true);
      const tx = await claim(sendingTx, message);
      setTxHash(tx.hash);
      await tx.wait();
      setClaimed(true);
    } catch (claimError) {
      logError({ claimError });
      if (
        claimError.message === TOKENS_CLAIMED ||
        isRevertedError(claimError)
      ) {
        handleClaimError();
      } else {
        showError(claimError.message);
      }
    } finally {
      setClaiming(false);
    }
  }, [claim, sendingTx, message, showError, setTxHash, handleClaimError]);

  return (
    <Flex
      w="100%"
      background="white"
      boxShadow="0px 1rem 2rem rgba(204, 218, 238, 0.8)"
      borderRadius="1rem"
      fontSize="sm"
      p={4}
      mb={4}
      direction="column"
    >
      <Grid
        templateColumns={{
          base: '1fr',
          md: '0.5fr 1.75fr 1fr 1fr 1.75fr',
          lg: '1fr 1.25fr 1fr 1fr 1.75fr',
        }}
        w="100%"
      >
        <Flex align="center" justify="space-between" mb={{ base: 1, md: 0 }}>
          <Text display={{ base: 'inline-block', md: 'none' }} color="greyText">
            Date
          </Text>
          <Text my="auto">{timestampString}</Text>
        </Flex>
        <Flex align="center" justify="space-between" mb={{ base: 1, md: 0 }}>
          <Text display={{ base: 'inline-block', md: 'none' }} color="greyText">
            Direction
          </Text>
          <Flex align="center">
            {getNetworkTag(chainId)}
            <Image src={RightArrowImage} mx="0.5rem" />
            {getNetworkTag(bridgeChainId)}
          </Flex>
        </Flex>
        <Flex
          align="center"
          justify={{ base: 'space-between', md: 'center' }}
          mb={{ base: 1, md: 0 }}
        >
          <Text display={{ base: 'inline-block', md: 'none' }} color="greyText">
            Sending Tx
          </Text>
          <Link
            color="blue.500"
            href={getMonitorUrl(chainId, sendingTx)}
            rel="noreferrer noopener"
            target="_blank"
            my="auto"
            textAlign="center"
          >
            {shortenHash(sendingTx)}
          </Link>
        </Flex>
        <Flex
          align="center"
          justify={{ base: 'space-between', md: 'center' }}
          mb={{ base: 1, md: 0 }}
        >
          <Text display={{ base: 'inline-block', md: 'none' }} color="greyText">
            Receiving Tx
          </Text>
          {receivingTx ? (
            <Link
              color="blue.500"
              href={`${getExplorerUrl(bridgeChainId)}/tx/${receivingTx}`}
              rel="noreferrer noopener"
              target="_blank"
              my="auto"
              textAlign="center"
            >
              {shortenHash(receivingTx)}
            </Link>
          ) : (
            <Text />
          )}
        </Flex>
        {receivingTx ? (
          <Flex
            align="center"
            justify={{ base: 'center', md: 'flex-end' }}
            w="100%"
          >
            <Image src={BlueTickImage} mr="0.5rem" />
            <Text color="blue.500">Claimed</Text>
          </Flex>
        ) : (
          <Flex align="center" justify={{ base: 'center', md: 'flex-end' }}>
            <Button
              w="auto"
              size="sm"
              colorScheme="blue"
              onClick={claimTokens}
              isLoading={claiming}
            >
              Claim
            </Button>
          </Flex>
        )}
      </Grid>
      <Flex mt="4" bg="#EEf4FD" borderRadius="1rem" p="4" direction="column">
        <Text> Items </Text>
        <DisplayTokens tokens={tokens} />
      </Flex>
    </Flex>
  );
};
