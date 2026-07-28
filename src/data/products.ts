export type Product = {
  id: number
  supplier: string
  name: string
  price: number
  retailPrice: number
  minOrder: number
  stock: number
  image: string
  detailImages: string[]
  badge?: string
  delivery: string
  category: string
  colors: string[]
  description: string
}

type CategorySeed = {
  category: string
  names: string[]
  images: string[]
  colors: string[]
  basePrice: number
}

const suppliers = ['모먼트어패럴', '먼데이팩토리', '오브제컴퍼니', '데일리유', '르바인', '소호스튜디오', '아틀리에온', '무드웨어']

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=88`

const seeds: CategorySeed[] = [
  {
    category: '아우터',
    names: ['오버핏 코튼 워크 자켓', '소프트 하프 트렌치 코트', '클래식 싱글 블레이저', '빈티지 워싱 데님 자켓', '라이트 윈드 브레이커', '린넨 크롭 자켓', '유틸리티 포켓 점퍼', '미니멀 레더 블루종', '캐시미어 핸드메이드 코트', '리버시블 퀼팅 점퍼', '테일러드 하프 자켓', '오버사이즈 후드 집업', '스탠드 칼라 야상', '부클 라운드 자켓', '벨티드 롱 트렌치', '패딩 베스트', '울 더블 하프 코트', '투웨이 집업 블루종', '코듀로이 트러커 자켓', '세미 크롭 무스탕'],
    images: [image('photo-1551488831-00ddcb6c6bd3'), image('photo-1539533018447-63fcce2678e3'), image('photo-1544022613-e87ca75a784a'), image('photo-1521223890158-f9f7c3d5d504')],
    colors: ['크림', '카키', '차콜'],
    basePrice: 28900,
  },
  {
    category: '상의',
    names: ['빈티지 스트라이프 니트', '베이직 코튼 라운드 티', '오버핏 옥스포드 셔츠', '소프트 브이넥 가디건', '골지 슬림 터틀넥', '프렌치 린넨 블라우스', '피그먼트 맨투맨', '캐시미어 라운드 니트', '루즈핏 후드 스웨트', '세일러 칼라 블라우스', '스퀘어넥 퍼프 티', '레터링 반팔 티셔츠', '하프 집업 카라 니트', '시스루 레이어드 셔츠', '울 케이블 베스트', '코튼 스트라이프 셔츠', '보트넥 슬림 티', '자수 로고 스웨트', '텐셀 폴라 티셔츠', '크롭 니트 가디건'],
    images: [image('photo-1576566588028-4147f3842f27'), image('photo-1521572163474-6864f9cf17ab'), image('photo-1562157873-818bc0726f68'), image('photo-1620799140408-edc6dcb6d6331')],
    colors: ['아이보리', '네이비', '블랙'],
    basePrice: 12900,
  },
  {
    category: '팬츠',
    names: ['클래식 와이드 슬랙스', '워싱 와이드 데님 팬츠', '핀턱 코튼 버뮤다 팬츠', '밴딩 조거 팬츠', '세미 부츠컷 슬랙스', '카고 포켓 팬츠', '스트레이트 생지 데님', '린넨 밴딩 팬츠', '투턱 울 슬랙스', '코듀로이 와이드 팬츠', '커브드 벌룬 팬츠', '슬림 크롭 팬츠', '빈티지 카펜터 데님', '플리츠 이지 팬츠', '하이웨스트 쇼츠', '사이드 라인 트랙 팬츠', '브러시드 기모 슬랙스', '스티치 와이드 데님', '레이온 밴딩 팬츠', '클래식 치노 팬츠'],
    images: [image('photo-1594633312681-425c7b97ccd1'), image('photo-1541099649105-f69ad21f3246'), image('photo-1506629082955-511b1aa562c8'), image('photo-1624378439575-d8705ad7ae80')],
    colors: ['블랙', '그레이', '베이지'],
    basePrice: 17800,
  },
  {
    category: '원피스',
    names: ['셔링 퍼프 롱 원피스', '미니멀 셔츠 원피스', '슬립 레이어드 드레스', '벨티드 플레어 원피스', '린넨 뷔스티에 원피스', '골지 니트 롱 드레스', '도트 랩 원피스', '데님 카라 원피스', '플리츠 미디 드레스', '스퀘어넥 미니 원피스', '코튼 티셔츠 원피스', '새틴 슬립 드레스', '세일러 칼라 원피스', '퍼프 플라워 드레스', '후드 스웨트 원피스', '트위드 미니 원피스', '스트라이프 셔츠 드레스', '드레이프 저지 원피스', '백 리본 롱 드레스', '레이어드 셋업 원피스'],
    images: [image('photo-1595777457583-95e059d581b8'), image('photo-1566174053879-31528523f8ae'), image('photo-1572804013309-59a88b7e92f1'), image('photo-1612336307429-8a898d10e223')],
    colors: ['아이보리', '브라운', '블랙'],
    basePrice: 21900,
  },
  {
    category: '가방',
    names: ['버터 스퀘어 숄더백', '미니 레더 크로스백', '캔버스 빅 토트백', '클래식 버킷백', '나일론 스트링 백팩', '위빙 라운드 숄더백', '소프트 호보백', '포켓 메신저백', '스웨이드 바게트백', '퀼팅 체인 미니백', '투웨이 보스턴백', '스퀘어 노트북 백', '셔링 클라우드백', '라탄 미니 토트', '벨트 포인트 숄더백', '멀티 포켓 크로스백', '빈티지 워싱 백팩', '파우치 세트 쇼퍼백', '메탈 버클 핸드백', '데일리 하프문 백'],
    images: [image('photo-1559563458-527698bf5295'), image('photo-1584917865442-de89df76afd3'), image('photo-1594223274512-ad4803739b7c'), image('photo-1566150905458-1bf1fc113f0d')],
    colors: ['버터', '브라운', '블랙'],
    basePrice: 14900,
  },
  {
    category: '슈즈',
    names: ['클래식 페니 로퍼', '데일리 독일군 스니커즈', '스퀘어토 앵클 부츠', '메리제인 플랫 슈즈', '플랫폼 캔버스 스니커즈', '소프트 레더 뮬', '청키 아웃솔 더비', '슬림 라인 롱부츠', '리본 발레리나 플랫', '스트랩 샌들 힐', '웨스턴 미들 부츠', '라운드토 블로퍼', '빈티지 러너 스니커즈', '퍼 라이닝 슬리퍼', '심플 첼시 부츠', '투 스트랩 샌들', '스웨이드 로퍼', '베이직 레인 부츠', '키튼힐 슬링백', '컴포트 쿠션 플랫'],
    images: [image('photo-1549298916-b41d501d3772'), image('photo-1543163521-1bf539c55dd2'), image('photo-1542291026-7eec264c27ff'), image('photo-1608256246200-53e635b5b65f')],
    colors: ['오프화이트', '브라운', '블랙'],
    basePrice: 16900,
  },
]

export const products: Product[] = seeds.flatMap((seed, categoryIndex) =>
  seed.names.map((name, index) => {
    const price = seed.basePrice + (index % 5) * 2100 + Math.floor(index / 5) * 1000
    return {
      id: categoryIndex * 100 + index + 1,
      supplier: suppliers[(categoryIndex + index) % suppliers.length]!,
      name,
      price,
      retailPrice: Math.round((price * (1.95 + (index % 3) * 0.08)) / 100) * 100,
      minOrder: [2, 3, 5][index % 3]!,
      stock: 36 + ((index * 17 + categoryIndex * 23) % 190),
      image: seed.images[index % seed.images.length]!,
      detailImages: Array.from(
        { length: seed.images.length },
        (_, imageIndex) => seed.images[(index + imageIndex) % seed.images.length]!,
      ),
      badge: index === 0 ? 'BEST' : index === 1 ? 'NEW' : index === 7 ? '재입고' : undefined,
      delivery: index % 3 === 0 ? '오늘출발' : index % 3 === 1 ? '2일 이내' : '3일 이내',
      category: seed.category,
      colors: seed.colors,
      description: `${name}은 셀러가 다양한 코디로 제안하기 좋은 ${seed.category} 상품입니다. 안정적인 품질과 경쟁력 있는 공급가로 구성했습니다.`,
    }
  }),
)
