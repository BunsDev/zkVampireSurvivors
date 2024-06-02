// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/ccip/libraries/Client.sol";
import {LinkTokenInterface} from "@chainlink/contracts@1.1.1/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/ccip/applications/CCIPReceiver.sol";

interface IAny2EVMMessageReceiver {
  function ccipReceive(Client.Any2EVMMessage calldata message) external;
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

contract ZKGameClient is OwnerIsCreator {
    struct MessageItem {
        address player;
        uint time;
        uint chainIndex;
    }

    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); // Used to make sure contract has enough balance.
    error InvalidRouter(address router);

    // Event emitted when a message is sent to another chain.
    event MessageSent(
        bytes32 indexed messageId, // The unique ID of the CCIP message.
        uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
        address receiver, // The address of the receiver on the destination chain.
        MessageItem messageItem, // The MessageItem being sent.
        address feeToken, // the token address used to pay CCIP fees.
        uint256 fees // The fees paid for sending the CCIP message.
    );

    // Event emitted when a message is received from another chain.
    event MessageReceived(
        bytes32 indexed messageId, // The unique ID of the message.
        uint64 indexed sourceChainSelector, // The chain selector of the source chain.
        address sender, // The address of the sender from the source chain.
        MessageItem messageItem // The MessageItem that was received.
    );

    // Used to identify the current chain
    // 0: Ethereum Sepolia testnet
    // 1: Avalanche Fuji testnet
    // 2: Polygon Amoy testnet
    uint public currentChainSelectorIndex = 0;

    address[] public routers; // CCIP Router address
    address[] public linkTokens; // Link token address
    uint64[] public chainSelectors; // Chain selector List
    address[3] public receivers; // receiver contract List

    MessageItem public currentMessageItem;

    uint[10] public topGradeList; // Top 10 grade List, timestamp
    address[10] public topPlayerList; // Top 10 player List, address
    uint[10] public topChainIndex; // Top 10 chainIndex List, address


    constructor(uint _currentChainSelectorIndex) {
        // init router address
        routers.push(0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59); // Ethereum Sepolia testnet
        routers.push(0xF694E193200268f9a4868e4Aa017A0118C9a8177); // Avalanche Fuji testnet
        routers.push(0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2); // Polygon Amoy testnet

        // init Link token address
        linkTokens.push(0x779877A7B0D9E8603169DdbD7836e478b4624789); // Ethereum Sepolia testnet
        linkTokens.push(0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846); // Avalanche Fuji testnet
        linkTokens.push(0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904); // Polygon Amoy testnet

        // init chain selector
        chainSelectors.push(16015286601757825753); // Ethereum Sepolia testnet
        chainSelectors.push(14767482510784806043); // Avalanche Fuji testnet
        chainSelectors.push(16281711391670634445); // Polygon Amoy testnet

        currentChainSelectorIndex = _currentChainSelectorIndex;
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == type(IAny2EVMMessageReceiver).interfaceId || interfaceId == type(IERC165).interfaceId;
    }

    // onlyOwner
    function updateReceivers(address[] memory receiverList) external onlyOwner {
        require(receiverList.length == receivers.length, "receiverList is not valid");
        for(uint i=0; i<receiverList.length; i++) {
            receivers[i] = receiverList[i];
        }
    }


    function submitData(uint time) external {
        // TODO: verify data
        // verify(bytes calldata _proof, bytes32[] calldata _publicInputs)

        // save data
        pushDataToTopList(MessageItem(msg.sender,time, currentChainSelectorIndex));

        // send data to another chains
        for(uint i=0; i<chainSelectors.length; i++) {
            uint64 chainSelector = chainSelectors[i];
            address receiver = receivers[i];
            if(chainSelectors[currentChainSelectorIndex] != chainSelector && receiver != address(0)) {
                _sendMessage(chainSelector, receiver, linkTokens[currentChainSelectorIndex], routers[currentChainSelectorIndex], MessageItem(
                    msg.sender,
                    time,
                    currentChainSelectorIndex
                ));
            }
        }
    }

    modifier onlyRouter() {
        if (msg.sender != address(routers[currentChainSelectorIndex])) revert InvalidRouter(msg.sender);
        _;
    }

    function ccipReceive(Client.Any2EVMMessage calldata message) external onlyRouter {
        _ccipReceive(message);
    }

    function _sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        address linkToken,
        address router,
        MessageItem memory messageItem
    ) internal returns (bytes32 messageId) {
        LinkTokenInterface s_linkToken = LinkTokenInterface(linkToken);
        IRouterClient s_router = IRouterClient(router);

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver), // ABI-encoded receiver address
            data: abi.encode(messageItem), // ABI-encoded MessageItem
            tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array indicating no tokens are being sent
            extraArgs: Client._argsToBytes(
                // Additional arguments, setting gas limit
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            // Set the feeToken  address, indicating LINK will be used for fees
            feeToken: linkToken
        });

        // Get the fee required to send the message
        uint256 fees = s_router.getFee(
            destinationChainSelector,
            evm2AnyMessage
        );

        if (fees > s_linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);

        // approve the Router to transfer LINK tokens on contract's behalf. It will spend the fees in LINK
        s_linkToken.approve(address(s_router), fees);

        // Send the message through the router and store the returned message ID
        messageId = s_router.ccipSend(destinationChainSelector, evm2AnyMessage);

        emit MessageSent(
            messageId,
            destinationChainSelector,
            receiver,
            messageItem,
            linkToken,
            fees
        );

        return messageId;
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal {
       currentMessageItem = abi.decode(any2EvmMessage.data, (MessageItem)); // abi-decoding of the sent text

        pushDataToTopList(currentMessageItem);

        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector, // fetch the source chain identifier (aka selector)
            abi.decode(any2EvmMessage.sender, (address)), // abi-decoding of the sender address,
            currentMessageItem
        );
    }

    /// Use binary search algorithm
    function pushDataToTopList(MessageItem memory messageItem) internal {
        uint time = messageItem.time;
        address player = messageItem.player;
        uint chainIndex = messageItem.chainIndex;

        if(topGradeList[topGradeList.length -1] < time) {
            uint left = 0;
            uint right = topGradeList.length - 1;
            uint mid;

            while (left < right) {
                mid = (left + right) / 2;
                if (topGradeList[mid] < time) {
                    right = mid;
                } else {
                    left = mid + 1;
                }
            }

            for(uint i = topGradeList.length - 1; i > left; i--) {
                topGradeList[i] = topGradeList[i - 1];
                topPlayerList[i] = topPlayerList[i - 1];
                topChainIndex[i] = topChainIndex[i - 1];
            }
            topGradeList[left] = time;
            topPlayerList[left] = player;
            topChainIndex[left] = chainIndex;
        }
    }

    function getTopGradeList() public view returns (uint[10] memory, uint[10] memory, address[10] memory) {
        return (topGradeList, topChainIndex, topPlayerList);
    }
}
