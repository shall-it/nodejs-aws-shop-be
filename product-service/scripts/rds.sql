
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE cart_status AS ENUM ('OPEN', 'ORDERED');

CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    created_at DATE NOT NULL,
    updated_at DATE NOT NULL,
    status cart_status
);


CREATE TABLE cart_items (
    cart_id UUID REFERENCES carts(id),
    product_id UUID DEFAULT uuid_generate_v4(),
    count INTEGER
);


DO $$
DECLARE 
  i integer;
  new_cart_id uuid;
BEGIN
  FOR i IN 1..5 LOOP
    INSERT INTO carts (created_at, updated_at, status)
    VALUES (CURRENT_DATE, CURRENT_DATE, 'OPEN')
    RETURNING id INTO new_cart_id;

    INSERT INTO cart_items (cart_id, count)
    VALUES (new_cart_id, 0);
  END LOOP;
 END $$;


-- DELETE FROM cart_items;
-- DELETE FROM carts;