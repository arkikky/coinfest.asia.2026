# Default pagination
GET /api/perviews/products/{event-id}

# Custom pagination (Strapi format)
GET /api/perviews/products/{event-id}?pagination[page]=2&pagination[pageSize]=10

# Simple format
GET /api/perviews/products/{event-id}?page=2&pageSize=10

# With filters
GET /api/perviews/products/{event-id}?category=Merchandise&status=published&page=1&pageSize=25


# Simple filter
GET /api/perviews/products/{event-id}?filters[product_name][$eq]=Product Name

# Case-insensitive contains
GET /api/perviews/products/{event-id}?filters[product_name][$containsi]=ticket

# Multiple values
GET /api/perviews/products/{event-id}?filters[id_products][$in][0]=id1&filters[id_products][$in][1]=id2

# Comparison
GET /api/perviews/products/{event-id}?filters[price][$gte]=100&filters[price][$lte]=500

# Complex filtering with $and
GET /api/perviews/products/{event-id}?filters[$and][0][price][$gte]=100&filters[$and][1][product_stock][$gt]=0

# Combined with pagination
GET /api/perviews/products/{event-id}?filters[product_name][$containsi]=ticket&pagination[page]=1&pagination[pageSize]=10



# Field selection
GET /api/perviews/products/{event-id}?fields[0]=product_name&fields[1]=price

# Populate all relations
GET /api/perviews/products/{event-id}?populate=*

# Populate specific relation
GET /api/perviews/products/{event-id}?populate[type_products]=*

# Populate with field selection
GET /api/perviews/products/{event-id}?populate[type_products][fields][0]=type_product_name

# Combine field selection and populate
GET /api/perviews/products/{event-id}?fields[0]=product_name&fields[1]=price&populate[type_products][fields][0]=type_product_name

# Combine with filters and pagination
GET /api/perviews/products/{event-id}?fields[0]=product_name&populate=*&filters[price][$gte]=100&pagination[page]=1



# Sort single field
GET /api/perviews/products/{event-id}?sort=product_name:asc

# Sort multiple fields
GET /api/perviews/products/{event-id}?sort[0]=price:desc&sort[1]=product_name:asc

# Pagination by page
GET /api/perviews/products/{event-id}?pagination[page]=1&pagination[pageSize]=10

# Pagination by offset
GET /api/perviews/products/{event-id}?pagination[start]=0&pagination[limit]=10

# Pagination without count
GET /api/perviews/products/{event-id}?pagination[page]=1&pagination[pageSize]=10&pagination[withCount]=false

# Combine all
GET /api/perviews/products/{event-id}?sort[0]=price:desc&pagination[page]=1&pagination[pageSize]=10&filters[price][$gte]=100

# Sebelum (route parameter)
GET /api/perviews/products/{event-id}?category=Tickets

# Sekarang (query parameter)
GET /api/perviews/products?events={event-id}&category=Tickets

# Dengan semua parameter
GET /api/perviews/products?events={event-id}&category=Tickets&status=published&sort[0]=price:desc&pagination[page]=1&pagination[pageSize]=10