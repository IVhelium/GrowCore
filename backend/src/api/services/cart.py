import uuid
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.constants import DeliveryStatus, OrderStatus, PaymentStatus, ProductModerationStatus, ReturnStatus
from src.models import CartItemModel, CartModel, OrderItemModel, OrderModel, ProductModel, UserModel
from src.schemas import AddCartItemDTO, CheckoutDTO, UpdateCartItemDTO


class CartService:
    COMPANY_FEE_RATE = Decimal("0.10")

    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db


    async def _safe_rollback(self) -> None:
        try:
            await self.db.rollback()

        except SQLAlchemyError:
            pass


    @staticmethod
    def _cart_options():
        return (
            selectinload(CartModel.items)
            .selectinload(CartItemModel.product)
            .selectinload(ProductModel.images),
        )


    async def _get_cart(
        self,
        current_user: UserModel,
    ) -> CartModel | None:
        """
        Returns the user's shopping cart, if it exists
        """

        query = (
            select(CartModel)
            .options(*self._cart_options())
            .where(CartModel.user_id == current_user.id)
            .execution_options(populate_existing=True)
        )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()


    async def _get_or_create_cart(
        self,
        current_user: UserModel,
    ) -> CartModel:
        """
        Returns the user's shopping cart or creates a new one
        """

        cart = await self._get_cart(current_user)

        if cart:
            return cart

        cart = CartModel(
            user_id=current_user.id,
            items=[],
        )

        self.db.add(cart)
        
        await self.db.flush()

        return cart


    async def _get_available_product(
        self,
        product_id: int,
    ) -> ProductModel:
        """
        Returns products that can be added to the cart
        Only products marked as “approved” and “enabled” can be added to the cart
        """

        query = (
            select(ProductModel)
            .options(selectinload(ProductModel.images))
            .where(ProductModel.id == product_id)
        )

        result = await self.db.execute(query)
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        if (
            product.moderation_status != ProductModerationStatus.approved
            or not product.enabled
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product is not available",
            )

        if product.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product is out of stock",
            )

        return product


    async def _get_cart_item(
        self,
        current_user: UserModel,
        item_id: int,
    ) -> CartItemModel:
        """
        Returns the current user's shopping cart item
        """

        query = (
            select(CartItemModel)
            .join(CartModel, CartModel.id == CartItemModel.cart_id)
            .options(
                selectinload(CartItemModel.product)
                .selectinload(ProductModel.images)
            )
            .where(
                CartItemModel.id == item_id,
                CartModel.user_id == current_user.id,
            )
        )

        result = await self.db.execute(query)
        item = result.scalar_one_or_none()

        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )

        return item


    async def get_my_cart(
        self,
        current_user: UserModel,
    ) -> CartModel:
        """
        Returns the current user's shopping cart
        If a shopping cart does not yet exist, one is created
        """

        try:
            cart = await self._get_or_create_cart(current_user)
            await self.db.commit()

        except IntegrityError:
            await self._safe_rollback()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not load cart",
            ) from exc

        cart = await self._get_cart(current_user)

        if not cart:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cart was not created",
            )

        return cart


    async def add_product_to_cart(
        self,
        current_user: UserModel,
        product_id: int,
        quantity: int = 1,
        commit: bool = True,
    ) -> CartModel:
        """
        Adds the item to the cart

        If the item is already in the cart, increases the quantity
        commit=False is used when moving an item from the favorites to the cart
        """

        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Quantity must be greater than zero",
            )

        try:
            product = await self._get_available_product(product_id)
            cart = await self._get_or_create_cart(current_user)

            existing_item = next(
                (
                    item
                    for item in cart.items
                    if item.product_id == product.id
                ),
                None,
            )

            if not existing_item:
                if quantity > product.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Not enough product quantity in stock",
                    )

                self.db.add(
                    CartItemModel(
                        cart_id=cart.id,
                        product_id=product.id,
                        quantity=quantity,
                    )
                )

            if commit:
                await self.db.commit()
            else:
                await self.db.flush()

        except HTTPException:
            if commit:
                await self._safe_rollback()

            raise

        except IntegrityError as exc:
            if commit:
                await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cart item already exists",
            ) from exc

        except SQLAlchemyError as exc:
            if commit:
                await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not add product to cart",
            ) from exc

        if commit:
            return await self.get_my_cart(current_user)

        cart = await self._get_cart(current_user)

        if not cart:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cart was not found after update",
            )

        return cart


    async def add_item(
        self,
        current_user: UserModel,
        schema: AddCartItemDTO,
    ) -> CartModel:
        """
        Adds the item to the cart
        """

        return await self.add_product_to_cart(
            current_user=current_user,
            product_id=schema.product_id,
            quantity=schema.quantity,
            commit=True,
        )


    async def update_item_quantity(
        self,
        current_user: UserModel,
        item_id: int,
        schema: UpdateCartItemDTO,
    ) -> CartModel:
        """
        Updates the quantity of items in the cart
        """

        try:
            item = await self._get_cart_item(
                current_user=current_user,
                item_id=item_id,
            )

            product = await self._get_available_product(item.product_id)

            if schema.quantity > product.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Not enough product quantity in stock",
                )

            item.quantity = schema.quantity

            await self.db.commit()

        except HTTPException:
            await self._safe_rollback()
            raise

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not update cart item",
            ) from exc

        return await self.get_my_cart(current_user)

    async def remove_item(
        self,
        current_user: UserModel,
        item_id: int,
    ) -> CartModel:
        """
        Removes the item from the cart
        """

        try:
            item = await self._get_cart_item(
                current_user=current_user,
                item_id=item_id,
            )

            await self.db.delete(item)
            await self.db.commit()

        except HTTPException:
            await self._safe_rollback()
            raise

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not remove cart item",
            ) from exc

        return await self.get_my_cart(current_user)


    async def clear_cart(
        self,
        current_user: UserModel,
    ) -> CartModel:
        """
        Completely clears the user's trash
        """

        try:
            cart = await self._get_or_create_cart(current_user)

            for item in list(cart.items):
                await self.db.delete(item)

            await self.db.commit()

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not clear cart",
            ) from exc

        return await self.get_my_cart(current_user)


    async def checkout(
        self,
        current_user: UserModel,
        schema: CheckoutDTO,
    ) -> CartModel:
        """
        Creates a pending order from the current cart.
        Stock and cart items are finalized only after successful payment.
        """

        try:
            cart = await self._get_cart(current_user)

            if not cart or not cart.items:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Cart is empty",
                )

            delivery_address = schema.delivery_address.strip() if schema.delivery_address else None

            total_price = Decimal("0.00")
            company_fee_total = Decimal("0.00")

            for item in cart.items:
                product = await self._get_available_product(item.product_id)

                if item.quantity > product.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Not enough quantity for {product.title}",
                    )

                line_total = product.discounted_price * item.quantity
                total_price += line_total
                company_fee_total += (line_total * self.COMPANY_FEE_RATE).quantize(
                    Decimal("0.01"),
                    rounding=ROUND_HALF_UP,
                )

            order = OrderModel(
                user_id=current_user.id,
                status=OrderStatus.inTransit,
                payment_status=PaymentStatus.pending,
                delivery_status=DeliveryStatus.preparing,
                return_status=ReturnStatus.none,
                total_price=total_price,
                company_fee_total=company_fee_total,
                delivery_address=delivery_address,
                tracking_number=f"GC-{uuid.uuid4().hex[:10].upper()}",
            )
            self.db.add(order)
            await self.db.flush()

            for item in list(cart.items):
                product = await self._get_available_product(item.product_id)
                line_total = product.discounted_price * item.quantity
                company_fee = (line_total * self.COMPANY_FEE_RATE).quantize(
                    Decimal("0.01"),
                    rounding=ROUND_HALF_UP,
                )

                self.db.add(
                    OrderItemModel(
                        order_id=order.id,
                        product_id=product.id,
                        price=product.discounted_price,
                        quantity=item.quantity,
                        company_fee=company_fee,
                        seller_amount=line_total - company_fee,
                    )
                )

            await self.db.commit()

        except HTTPException:
            await self._safe_rollback()
            raise

        except SQLAlchemyError as exc:
            await self._safe_rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not complete checkout",
            ) from exc

        return await self.get_my_cart(current_user)
