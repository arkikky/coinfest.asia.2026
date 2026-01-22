"use client";
import Link from 'next/link';
import Image from 'next/image';
import Container from '@/components/Customs/Container';
import { usePathname } from 'next/navigation';
import FooterSocialMedia from '@/components/Customs/Footers/FooterSocialMedia';

interface SocialMediaItem {
  label: string;
  icons: string;
  url: string;
}

interface FooterProps {
  menuUsage?: boolean;
}

const Footer: React.FC<FooterProps> = ({ menuUsage = true }) => {
  const pathname = usePathname();
  const socialMediaList: SocialMediaItem[] = [
    {
      label: 'Instagram',
      icons: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Media%20Folders/Icons/Social%20Media/InstagramDark-SocialMedia.svg`,
      url: 'https://www.instagram.com/coinfest.asia/',
    },
    {
      label: 'Twitter',
      icons: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Media%20Folders/Icons/Social%20Media/TwitterDark-SocialMedia.svg`,
      url: 'https://twitter.com/coinfestasia',
    },
    {
      label: 'Telegram',
      icons: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Media%20Folders/Icons/Social%20Media/TelegramDark-SocialMedia.svg`,
      url: 'https://t.me/coinfestasiaofficial',
    },
    {
      label: 'LinkedIn',
      icons: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Media%20Folders/Icons/Social%20Media/LinkedInDark-SocialMedia.svg`,
      url: 'https://www.linkedin.com/showcase/coinfest/',
    },
  ];

  return (
    <>
      <footer
        className={`ca26Footer pt-6 relative justify-end overflow-x-hidden pb-6 sm:pb-8`}
      >
        <Container>
          <div className={`relative ${pathname !== '/agenda'  ? 'z-10' : 'z-0'} flex flex-col items-start justify-start`}>
            <div className="block w-full">
              <div className="flex flex-col md:flex-row w-full">
                <div className="relative block w-max md:order-1">
                  {/* {theme === 'light' ? (
                    <Image
                      className="mx-auto my-auto aspect-auto h-auto w-[148px] sm:w-[172px]"
                      src={'/assets/images/ca2025BrandDark.svg'}
                      alt={`${publicRuntimeConfig?.siteAppName} Primary Brand LOGO Footer`}
                      height={58}
                      width={170}
                      quality={87}
                    />
                  ) : (
                    <Image
                      className="mx-auto my-auto aspect-auto h-auto w-[148px] sm:w-[172px]"
                      src={'/assets/images/ca2025BrandLight.svg'}
                      alt={`${publicRuntimeConfig?.siteAppName} Primary Brand LOGO Footer`}
                      height={58}
                      width={170}
                      quality={87}
                    />
                  )} */}
                </div>

                {/* {menuUsage === true ? <FooterMenuRev isTheme={theme} /> : null} */}
              </div>
              <div
                className={`mt-6 lg:mt-20 xl:mt-24 block w-full text-left pr-0 text-sm font-normal sm:text-pretty sm:pr-4 lg:pr-0 xl:text-wrap xl:pr-[98px]`}
              >
                {`Coinfest Asia adalah acara tertutup yang berfokus pada edukasi dan pengembangan industri, dengan tujuan memberi dampak positif terhadap perekonomian Indonesia. Partisipasi terbatas hanya untuk tamu undangan dan peserta yang telah terdaftar.`}
              </div>
            </div>
            <div className="relative z-10 mt-8 flex w-full flex-col items-start justify-start sm:mt-10 lg:flex-row lg:items-center lg:justify-between">
              <div
                className={`w-full max-w-[567px] text-left sm:text-balance text-sm font-normal [&_*&:after]:content-[''] [&_a]:text-primary [&_a]:underline [&_*&:after]:block [&_*&:after]:w-full [&_*&:after]:h-px [&_*&:after]:bg-white/20 xl:max-w-max`}
              >
                Copyright © <span className='text-primary underline'>Coinfest Asia</span>. All rights reserved, Coinfest
                is organized by{' '}
                <Link
                  href="https://coinvestasi.com/"
                  title={`${process.env.NEXT_PUBLIC_APP_URL} organized by Coinvestasi`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Coinvestasi
                </Link>
                , a subsidiary of&nbsp;
                <Link
                  href="https://indonesiacrypto.network/"
                  title={`${process.env.NEXT_PUBLIC_APP_URL} a subsidiary of Indonesia Crypto Network`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Indonesia Crypto Network
                </Link>
                .
              </div>

              {/* @list-socialmedia */}
              <FooterSocialMedia list={socialMediaList} />
            </div>
          </div>
        </Container>
      </footer>
    </>
  );
};

export default Footer;
