// Enter the lottery (paying some amount)
// Pick a random winner (verifiably random)
// Wineer to be selected every x minutes -> completely automate
// Chainlink Orcale -> Randomness, Automated Extection (Chainlink keeper)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
error Raffle_NotEnoughtETHEntered();
error Raffle_TransferFailed();

contract Raffle is VRFConsumerBaseV2 {
    // State Variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant i_requestConfirmations = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant i_numWords = 1;

    // Lottery Varaibles
    address private s_recentWinner;
    // Events
    event RaffleEnter(address indexed player);
    event RaffleRequestWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        address vrfCoordinatorV2,
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle_NotEnoughtETHEntered();
        }
        s_players.push(payable(msg.sender));
        // Emit an even when we update a dynamic array or mapping
        emit RaffleEnter(msg.sender);
    }

    function requestRandomeWinner() external {
        // Request the random number
        // Once we get it, do something with it
        // 2 transaction process
        uint256 requestId = vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            i_requestConfirmations,
            i_callbackGasLimit,
            i_numWords
        );
        emit RaffleRequestWinner(requestId);
    }

    function fulfillRandomWords(
        uint256 /*_requestId*/,
        uint256[] memory _randomWords
    ) internal override {
        uint256 indexOfWinner = _randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        (bool success, ) = s_recentWinner.call{value: address(this).balance}(
            ""
        );

        if (!success) {
            revert Raffle_TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }
}
