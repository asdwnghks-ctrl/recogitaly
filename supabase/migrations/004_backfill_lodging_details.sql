update public.trip_days
set
  lodging_address = case lodging
    when '로마 아파트' then 'Via Luigi Fincati 14 int 11, Roma'
    when '베네치아 아파트' then 'Via Nervesa 4/06, Venezia'
    when '돌로미티 숙소' then 'Via di Cercena 98, Cercena, Trentino-Alto Adige 38031'
    when '피렌체 숙소' then 'Viale Giovanni Battista Morgagni 23, Firenze'
    else lodging_address
  end,
  lodging_map_url = case lodging
    when '로마 아파트' then 'https://www.google.com/maps/search/?api=1&query=via+luigi+fincati+14+int+11+Roma'
    when '베네치아 아파트' then 'https://www.google.com/maps/search/?api=1&query=Via+Nervesa+4+06+Venezia'
    when '돌로미티 숙소' then 'https://www.google.com/maps/search/?api=1&query=via+di+cercena+98+cercena+trentino+alto+adige+38031'
    when '피렌체 숙소' then 'https://www.google.com/maps/search/?api=1&query=viale+giovanni+battista+morgagni+23+Florence'
    else lodging_map_url
  end
where lodging in ('로마 아파트', '베네치아 아파트', '돌로미티 숙소', '피렌체 숙소')
  and (lodging_address = '' or lodging_map_url = '');
