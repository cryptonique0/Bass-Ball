// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BassBallMerchandise
 * @notice On-chain team merchandise ordering system with crypto payments
 * @dev Supports ETH, USDC, and custom game tokens for shirt purchases
 */
interface IBassBallMerchandise {
    enum JerseyType {
        HOME,
        AWAY,
        NEUTRAL
    }

    enum OrderStatus {
        PENDING,
        CONFIRMED,
        PROCESSING,
        SHIPPED,
        DELIVERED,
        CANCELLED
    }

    struct ShirtOrder {
        uint256 orderId;
        uint256 teamId;
        address fan;
        JerseyType jerseyType;
        string size; // XS, S, M, L, XL, XXL
        string playerName; // Optional custom name
        uint8 playerNumber; // Optional number (0 = none)
        uint256 totalPrice; // In wei or token units
        address paymentToken; // address(0) for ETH, token address otherwise
        OrderStatus status;
        uint64 orderDate;
        uint64 confirmedDate;
        string trackingNumber;
    }

    struct TeamPricing {
        uint256 homeShirtPrice;
        uint256 awayShirtPrice;
        uint256 neutralShirtPrice;
        uint256 customNameFee;
        uint256 customNumberFee;
        uint256 shippingFee;
        uint16 royaltyBps; // Basis points (10000 = 100%)
        uint16 holderDiscountBps; // Discount for team NFT holders
        bool merchandiseEnabled;
    }

    // ==================== EVENTS ====================

    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed teamId,
        address indexed fan,
        JerseyType jerseyType,
        uint256 totalPrice
    );

    event OrderPaid(
        uint256 indexed orderId,
        address indexed fan,
        uint256 amount,
        address paymentToken
    );

    event OrderStatusUpdated(
        uint256 indexed orderId,
        OrderStatus newStatus,
        string trackingNumber
    );

    event OrderCancelled(
        uint256 indexed orderId,
        address indexed fan,
        uint256 refundAmount
    );

    event TeamPricingUpdated(
        uint256 indexed teamId,
        uint256 homePrice,
        uint256 awayPrice,
        uint256 neutralPrice
    );

    event RoyaltyPaid(
        uint256 indexed teamId,
        address indexed recipient,
        uint256 amount
    );

    // ==================== ORDERING ====================

    /**
     * @notice Create a new shirt order
     * @param teamId The team NFT ID
     * @param jerseyType Home, Away, or Neutral
     * @param size Shirt size (XS-XXL)
     * @param playerName Optional custom name (empty string if none)
     * @param playerNumber Optional number (0 if none)
     * @param paymentToken Token address (address(0) for ETH)
     * @return orderId The new order ID
     */
    function createOrder(
        uint256 teamId,
        JerseyType jerseyType,
        string calldata size,
        string calldata playerName,
        uint8 playerNumber,
        address paymentToken
    ) external returns (uint256 orderId);

    /**
     * @notice Pay for an order
     * @param orderId The order to pay for
     * @dev For ETH: send msg.value. For tokens: approve first, then call
     */
    function payOrder(uint256 orderId) external payable;

    /**
     * @notice Cancel an order (only if not shipped)
     * @param orderId The order to cancel
     */
    function cancelOrder(uint256 orderId) external;

    /**
     * @notice Get order details
     * @param orderId The order ID
     * @return order The order struct
     */
    function getOrder(uint256 orderId)
        external
        view
        returns (ShirtOrder memory order);

    /**
     * @notice Get all orders by a fan
     * @param fan The fan address
     * @return orderIds Array of order IDs
     */
    function getOrdersByFan(address fan)
        external
        view
        returns (uint256[] memory orderIds);

    /**
     * @notice Get all orders for a team
     * @param teamId The team NFT ID
     * @return orderIds Array of order IDs
     */
    function getOrdersByTeam(uint256 teamId)
        external
        view
        returns (uint256[] memory orderIds);

    // ==================== TEAM PRICING ====================

    /**
     * @notice Set pricing for a team (only team owner)
     * @param teamId The team NFT ID
     * @param pricing The pricing configuration
     */
    function setTeamPricing(
        uint256 teamId,
        TeamPricing calldata pricing
    ) external;

    /**
     * @notice Get team pricing
     * @param teamId The team NFT ID
     * @return pricing The pricing struct
     */
    function getTeamPricing(uint256 teamId)
        external
        view
        returns (TeamPricing memory pricing);

    /**
     * @notice Calculate order price
     * @param teamId The team NFT ID
     * @param jerseyType Jersey type
     * @param hasCustomName Whether order has custom name
     * @param hasCustomNumber Whether order has custom number
     * @param isNFTHolder Whether buyer holds team NFT
     * @return totalPrice The total price in wei/tokens
     */
    function calculateOrderPrice(
        uint256 teamId,
        JerseyType jerseyType,
        bool hasCustomName,
        bool hasCustomNumber,
        bool isNFTHolder
    ) external view returns (uint256 totalPrice);

    // ==================== ADMIN & FULFILLMENT ====================

    /**
     * @notice Update order status (only fulfillment role)
     * @param orderId The order ID
     * @param newStatus The new status
     * @param trackingNumber Optional tracking number (empty if none)
     */
    function updateOrderStatus(
        uint256 orderId,
        OrderStatus newStatus,
        string calldata trackingNumber
    ) external;

    /**
     * @notice Withdraw team royalties
     * @param teamId The team NFT ID
     * @param recipient Address to send funds
     */
    function withdrawTeamRoyalties(
        uint256 teamId,
        address payable recipient
    ) external;

    /**
     * @notice Get team revenue stats
     * @param teamId The team NFT ID
     * @return totalOrders Number of confirmed orders
     * @return totalRevenue Total revenue generated
     * @return pendingRoyalties Royalties available to withdraw
     */
    function getTeamRevenue(uint256 teamId)
        external
        view
        returns (
            uint256 totalOrders,
            uint256 totalRevenue,
            uint256 pendingRoyalties
        );

    // ==================== METADATA ====================

    /**
     * @notice Get jersey design URI for a team
     * @param teamId The team NFT ID
     * @param jerseyType Jersey type
     * @return uri IPFS URI or data URI for jersey SVG
     */
    function getJerseyDesignURI(uint256 teamId, JerseyType jerseyType)
        external
        view
        returns (string memory uri);

    /**
     * @notice Set jersey design URI (only team owner)
     * @param teamId The team NFT ID
     * @param jerseyType Jersey type
     * @param uri IPFS or data URI
     */
    function setJerseyDesignURI(
        uint256 teamId,
        JerseyType jerseyType,
        string calldata uri
    ) external;
}

/**
 * @title BassBallMerchandiseImpl
 * @notice Implementation of the merchandise system
 */
contract BassBallMerchandise is IBassBallMerchandise {
    // Team NFT contract
    address public immutable teamNFT;
    
    // Order counter
    uint256 private orderCounter;
    
    // Orders storage
    mapping(uint256 => ShirtOrder) public orders;
    mapping(uint256 => TeamPricing) public teamPricing;
    mapping(address => uint256[]) private fanOrders;
    mapping(uint256 => uint256[]) private teamOrders;
    mapping(uint256 => uint256) public teamRoyalties;
    mapping(uint256 => mapping(uint8 => string)) private jerseyDesignURIs; // teamId => jerseyType => URI
    
    // Supported payment tokens
    mapping(address => bool) public supportedTokens;
    
    // Access control
    address public admin;
    mapping(address => bool) public fulfillmentRoles;
    
    modifier onlyTeamOwner(uint256 teamId) {
        require(
            ITeamNFT(teamNFT).ownerOf(teamId) == msg.sender,
            "Not team owner"
        );
        _;
    }
    
    modifier onlyFulfillment() {
        require(fulfillmentRoles[msg.sender] || msg.sender == admin, "Not authorized");
        _;
    }

    constructor(address _teamNFT) {
        teamNFT = _teamNFT;
        admin = msg.sender;
        fulfillmentRoles[msg.sender] = true;
    }

    // ==================== ORDERING ====================

    function createOrder(
        uint256 teamId,
        JerseyType jerseyType,
        string calldata size,
        string calldata playerName,
        uint8 playerNumber,
        address paymentToken
    ) external override returns (uint256 orderId) {
        TeamPricing memory pricing = teamPricing[teamId];
        require(pricing.merchandiseEnabled, "Merchandise disabled");
        require(
            paymentToken == address(0) || supportedTokens[paymentToken],
            "Token not supported"
        );

        orderId = ++orderCounter;
        bool isNFTHolder = ITeamNFT(teamNFT).balanceOf(msg.sender) > 0;
        
        uint256 totalPrice = calculateOrderPrice(
            teamId,
            jerseyType,
            bytes(playerName).length > 0,
            playerNumber > 0,
            isNFTHolder
        );

        orders[orderId] = ShirtOrder({
            orderId: orderId,
            teamId: teamId,
            fan: msg.sender,
            jerseyType: jerseyType,
            size: size,
            playerName: playerName,
            playerNumber: playerNumber,
            totalPrice: totalPrice,
            paymentToken: paymentToken,
            status: OrderStatus.PENDING,
            orderDate: uint64(block.timestamp),
            confirmedDate: 0,
            trackingNumber: ""
        });

        fanOrders[msg.sender].push(orderId);
        teamOrders[teamId].push(orderId);

        emit OrderCreated(orderId, teamId, msg.sender, jerseyType, totalPrice);
    }

    function payOrder(uint256 orderId) external payable override {
        ShirtOrder storage order = orders[orderId];
        require(order.fan == msg.sender, "Not your order");
        require(order.status == OrderStatus.PENDING, "Order not pending");

        if (order.paymentToken == address(0)) {
            require(msg.value == order.totalPrice, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH not accepted");
            IERC20(order.paymentToken).transferFrom(
                msg.sender,
                address(this),
                order.totalPrice
            );
        }

        order.status = OrderStatus.CONFIRMED;
        order.confirmedDate = uint64(block.timestamp);

        // Calculate and store royalty
        TeamPricing memory pricing = teamPricing[order.teamId];
        uint256 royalty = (order.totalPrice * pricing.royaltyBps) / 10000;
        teamRoyalties[order.teamId] += royalty;

        emit OrderPaid(orderId, msg.sender, order.totalPrice, order.paymentToken);
    }

    function calculateOrderPrice(
        uint256 teamId,
        JerseyType jerseyType,
        bool hasCustomName,
        bool hasCustomNumber,
        bool isNFTHolder
    ) public view override returns (uint256 totalPrice) {
        TeamPricing memory pricing = teamPricing[teamId];
        
        if (jerseyType == JerseyType.HOME) {
            totalPrice = pricing.homeShirtPrice;
        } else if (jerseyType == JerseyType.AWAY) {
            totalPrice = pricing.awayShirtPrice;
        } else {
            totalPrice = pricing.neutralShirtPrice;
        }

        if (hasCustomName) totalPrice += pricing.customNameFee;
        if (hasCustomNumber) totalPrice += pricing.customNumberFee;
        totalPrice += pricing.shippingFee;

        if (isNFTHolder && pricing.holderDiscountBps > 0) {
            uint256 discount = (totalPrice * pricing.holderDiscountBps) / 10000;
            totalPrice -= discount;
        }
    }

    // Additional methods implementation would follow...
    // cancelOrder, updateOrderStatus, withdrawTeamRoyalties, etc.
    
    function getOrder(uint256 orderId)
        external
        view
        override
        returns (ShirtOrder memory)
    {
        return orders[orderId];
    }

    function getOrdersByFan(address fan)
        external
        view
        override
        returns (uint256[] memory)
    {
        return fanOrders[fan];
    }

    function getOrdersByTeam(uint256 teamId)
        external
        view
        override
        returns (uint256[] memory)
    {
        return teamOrders[teamId];
    }

    function setTeamPricing(uint256 teamId, TeamPricing calldata pricing)
        external
        override
        onlyTeamOwner(teamId)
    {
        teamPricing[teamId] = pricing;
        emit TeamPricingUpdated(
            teamId,
            pricing.homeShirtPrice,
            pricing.awayShirtPrice,
            pricing.neutralShirtPrice
        );
    }

    function getTeamPricing(uint256 teamId)
        external
        view
        override
        returns (TeamPricing memory)
    {
        return teamPricing[teamId];
    }

    function updateOrderStatus(
        uint256 orderId,
        OrderStatus newStatus,
        string calldata trackingNumber
    ) external override onlyFulfillment {
        ShirtOrder storage order = orders[orderId];
        order.status = newStatus;
        if (bytes(trackingNumber).length > 0) {
            order.trackingNumber = trackingNumber;
        }
        emit OrderStatusUpdated(orderId, newStatus, trackingNumber);
    }

    function withdrawTeamRoyalties(uint256 teamId, address payable recipient)
        external
        override
        onlyTeamOwner(teamId)
    {
        uint256 amount = teamRoyalties[teamId];
        require(amount > 0, "No royalties");
        teamRoyalties[teamId] = 0;
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
        emit RoyaltyPaid(teamId, recipient, amount);
    }

    function getTeamRevenue(uint256 teamId)
        external
        view
        override
        returns (
            uint256 totalOrders,
            uint256 totalRevenue,
            uint256 pendingRoyalties
        )
    {
        totalOrders = teamOrders[teamId].length;
        for (uint256 i = 0; i < totalOrders; i++) {
            ShirtOrder memory order = orders[teamOrders[teamId][i]];
            if (order.status != OrderStatus.CANCELLED) {
                totalRevenue += order.totalPrice;
            }
        }
        pendingRoyalties = teamRoyalties[teamId];
    }

    function getJerseyDesignURI(uint256 teamId, JerseyType jerseyType)
        external
        view
        override
        returns (string memory)
    {
        return jerseyDesignURIs[teamId][uint8(jerseyType)];
    }

    function setJerseyDesignURI(
        uint256 teamId,
        JerseyType jerseyType,
        string calldata uri
    ) external override onlyTeamOwner(teamId) {
        jerseyDesignURIs[teamId][uint8(jerseyType)] = uri;
    }

    function cancelOrder(uint256 orderId) external override {
        ShirtOrder storage order = orders[orderId];
        require(order.fan == msg.sender, "Not your order");
        require(
            order.status == OrderStatus.PENDING ||
            order.status == OrderStatus.CONFIRMED,
            "Cannot cancel"
        );

        order.status = OrderStatus.CANCELLED;
        
        if (order.status == OrderStatus.CONFIRMED) {
            // Refund
            if (order.paymentToken == address(0)) {
                (bool success, ) = payable(msg.sender).call{value: order.totalPrice}("");
                require(success, "Refund failed");
            } else {
                IERC20(order.paymentToken).transfer(msg.sender, order.totalPrice);
            }
            
            // Deduct royalty
            TeamPricing memory pricing = teamPricing[order.teamId];
            uint256 royalty = (order.totalPrice * pricing.royaltyBps) / 10000;
            teamRoyalties[order.teamId] -= royalty;
        }

        emit OrderCancelled(orderId, msg.sender, order.totalPrice);
    }
}

interface ITeamNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}
