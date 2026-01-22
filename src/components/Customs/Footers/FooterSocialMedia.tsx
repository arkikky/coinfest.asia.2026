"use client";
import Link from 'next/link';
import Image from 'next/image';

type SocialMediaItem = {
  label: string;
  url: string;
  icons: string;
};

type FooterSocialMediaProps = {
  list: SocialMediaItem[];
};
const FooterSocialMedia = ({ list = [] }: FooterSocialMediaProps) => {
  return (
    <>
      <ul className="relative mt-5 flex flex-row pl-0 lg:mt-0">
        {list?.map((rslt, i) => (
          <li className="mr-3 last:mr-0" key={i}>
            <Link
              className="outline-none focus-visible:outline-none"
              href={rslt?.url || '#'}
              title={`${process.env.NEXT_PUBLIC_APP_URL} ${rslt?.label} Social Media`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Image src={rslt?.icons} alt={rslt?.label} className='size-6 shrink-0' width={24} height={24} unoptimized={true} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};

export default FooterSocialMedia;
