// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/ccip/libraries/Client.sol";
import {LinkTokenInterface} from "@chainlink/contracts@1.1.1/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip@1.4.0/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {ConfirmedOwner} from "@chainlink/contracts@1.1.1/src/v0.8/shared/access/ConfirmedOwner.sol";
import {LinkTokenInterface} from "@chainlink/contracts@1.1.1/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import {VRFV2PlusWrapperConsumerBase} from "@chainlink/contracts@1.1.1/src/v0.8/vrf/dev/VRFV2PlusWrapperConsumerBase.sol";
import {VRFV2PlusClient} from "@chainlink/contracts@1.1.1/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

interface IAny2EVMMessageReceiver {
  function ccipReceive(Client.Any2EVMMessage calldata message) external;
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

contract ZKGameClient is VRFV2PlusWrapperConsumerBase, ConfirmedOwner {
    struct MessageItem {
        address player;
        uint time;
        uint chainIndex;
    }

    // 0: Gold; 1: Diamond; 2: skin; 3: Weapon
    struct LotteryItem {
        uint itemType;
        uint num;
    }

    struct RequestLotteryStatus {
        uint256 paid; // amount paid in link
        bool fulfilled; // whether the request has been successfully fulfilled
        uint256[] randomWords;
        LotteryItem lotteryItem;
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

    event RequestLotterySent(uint256 requestId, uint32 numWords);
    event RequestLotteryFulfilled(
        uint256 requestId,
        uint256[] randomWords,
        uint256 payment,
        LotteryItem lotteryItem
    );

    // Used to identify the current chain
    // 0: Ethereum Sepolia testnet
    // 1: Avalanche Fuji testnet
    // 2: Polygon Amoy testnet
    uint public currentChainSelectorIndex = 0;

    // CCIP Router address
    address[3] public routers = [
        0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59, // Ethereum Sepolia testnet
        0xF694E193200268f9a4868e4Aa017A0118C9a8177, // Avalanche Fuji testnet
        0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2 // Polygon Amoy testnet
    ]; 
    // Link token address
    address[3] public linkTokens = [
        0x779877A7B0D9E8603169DdbD7836e478b4624789, // Ethereum Sepolia testnet
        0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846, // Avalanche Fuji testnet
        0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904 // Polygon Amoy testnet
    ]; 
    address[3] public wrapperAddressList = [
        0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1, // Ethereum Sepolia testnet
        0x327B83F409E1D5f13985c6d0584420FA648f1F56, // Avalanche Fuji testnet
        0x6e6c366a1cd1F92ba87Fd6f96F743B0e6c967Bf0 // Polygon Amoy testnet
    ];
    // Chain selector List
    uint64[3] public chainSelectors = [
        16015286601757825753, // Ethereum Sepolia testnet
        14767482510784806043, // Avalanche Fuji testnet
        16281711391670634445 // Polygon Amoy testnet
    ];
     // receiver contract List
    address[3] public receivers;

    // current network key flag
    MessageItem public currentMessageItem;

    LotteryItem[] public LotteryItemList;
    mapping(address => uint256) public playerLastlotteryRequestIdMap; /*  address --> requestId */
    mapping(uint256 => RequestLotteryStatus) public lotteryRequestMap; /* requestId --> requestStatus */

    /// topList
    uint[10] public topGradeList; // Top 10 grade List, timestamp
    address[10] public topPlayerList; // Top 10 player List, address
    uint[10] public topChainIndex; // Top 10 chainIndex List, address
    uint public lastUpdateTime; // last update time of topList


    constructor(uint _currentChainSelectorIndex)
        ConfirmedOwner(msg.sender)
        VRFV2PlusWrapperConsumerBase(wrapperAddressList[_currentChainSelectorIndex]) {
        currentChainSelectorIndex = _currentChainSelectorIndex;
        initLotteryList();
    }

    function initLotteryList() public onlyOwner {
        LotteryItemList.push(LotteryItem(0,100));
        LotteryItemList.push(LotteryItem(0,50));
        LotteryItemList.push(LotteryItem(1,10));
        LotteryItemList.push(LotteryItem(0,50));
        LotteryItemList.push(LotteryItem(0,150));
        LotteryItemList.push(LotteryItem(3,18));
        LotteryItemList.push(LotteryItem(0,200));
        LotteryItemList.push(LotteryItem(0,50));
        LotteryItemList.push(LotteryItem(1,20));
        LotteryItemList.push(LotteryItem(0,50));
        LotteryItemList.push(LotteryItem(0,200));
        LotteryItemList.push(LotteryItem(3,9));
    }

    // lottery
    function requestLottery() external returns (uint256) {
        // TODO: pay $1

        bytes memory extraArgs = VRFV2PlusClient._argsToBytes(
            VRFV2PlusClient.ExtraArgsV1({nativePayment: false}) // use Link token
        );
         // use Link token to request random
        (uint256 requestId, uint256 reqPrice) = requestRandomness(
                1000000,
                3,
                1,
                extraArgs
        );
        lotteryRequestMap[requestId] = RequestLotteryStatus({
            paid: reqPrice,
            randomWords: new uint256[](0),
            fulfilled: false,
            lotteryItem: LotteryItem(0,0)
        });
        playerLastlotteryRequestIdMap[msg.sender] = requestId;
        emit RequestLotterySent(requestId, 1);
        return requestId;
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        require(_randomWords.length > 0, "randomWords not found");
        require(lotteryRequestMap[_requestId].paid > 0, "request not found");
        uint index = _randomWords[0]%LotteryItemList.length;
        LotteryItem memory item = LotteryItemList[index];
        lotteryRequestMap[_requestId].fulfilled = true;
        lotteryRequestMap[_requestId].randomWords = _randomWords;
        lotteryRequestMap[_requestId].lotteryItem = item;
        // use 0.5 LINK token

        // TODO: distribute

        emit RequestLotteryFulfilled(
            _requestId,
            _randomWords,
            lotteryRequestMap[_requestId].paid,
            item
        );
    }

    function getPlayerLastLotteryRequestStatus() external view
        returns (uint256 paid, bool fulfilled, LotteryItem memory lotteryItem )
    {
        uint256 requestId = playerLastlotteryRequestIdMap[msg.sender];
        require(lotteryRequestMap[requestId].paid > 0, "request not found");
        RequestLotteryStatus memory request = lotteryRequestMap[requestId];
        return (request.paid, request.fulfilled, request.lotteryItem);
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

        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(messageItem), // ABI-encoded MessageItem
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: linkToken
        });

        uint256 fees = s_router.getFee(
            destinationChainSelector,
            evm2AnyMessage
        );
        if (fees > s_linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);

        s_linkToken.approve(address(s_router), fees);

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
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address)),
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

        lastUpdateTime = block.timestamp;
    }

    function getTopListInfo() public view returns (uint[10] memory, uint[10] memory, address[10] memory, uint) {
        return (topGradeList, topChainIndex, topPlayerList, lastUpdateTime);
    }

    /**
     * Allow withdraw of Link tokens from the contract
     */
    function withdrawLink() public onlyOwner {
        require(linkTokens[currentChainSelectorIndex] != address(0), 'error: withdrawLink is not supported');
        LinkTokenInterface link = LinkTokenInterface(linkTokens[currentChainSelectorIndex]);
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer"
        );
    }
}
